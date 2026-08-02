
CREATE OR REPLACE FUNCTION public.is_job_contractor(_job_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.contractor_profiles cp ON cp.id = j.contractor_id
    WHERE j.id = _job_id AND cp.user_id = _uid
  )
$$;

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS live_progress_percent integer NOT NULL DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS progress_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.site_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'in' CHECK (kind IN ('in','out')),
  latitude double precision,
  longitude double precision,
  place_name text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_checkins TO authenticated;
GRANT ALL ON public.site_checkins TO service_role;
ALTER TABLE public.site_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkin worker insert own" ON public.site_checkins FOR INSERT TO authenticated WITH CHECK (worker_id = auth.uid());
CREATE POLICY "checkin worker read own" ON public.site_checkins FOR SELECT TO authenticated USING (worker_id = auth.uid());
CREATE POLICY "checkin contractor read" ON public.site_checkins FOR SELECT TO authenticated USING (public.is_job_contractor(job_id, auth.uid()));
CREATE POLICY "checkin admin read" ON public.site_checkins FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.site_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_proofs TO authenticated;
GRANT ALL ON public.site_proofs TO service_role;
ALTER TABLE public.site_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proof insert own" ON public.site_proofs FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "proof read" ON public.site_proofs FOR SELECT TO authenticated USING (
  uploaded_by = auth.uid()
  OR public.is_job_contractor(job_id, auth.uid())
  OR public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'client')
);
CREATE POLICY "proof contractor verify" ON public.site_proofs FOR UPDATE TO authenticated
  USING (public.is_job_contractor(job_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_job_contractor(job_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "proof delete own or admin" ON public.site_proofs FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.compliance_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  doc_type text NOT NULL,
  doc_number text,
  file_url text,
  issued_on date,
  expires_on date,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','verified','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_docs TO authenticated;
GRANT ALL ON public.compliance_docs TO service_role;
ALTER TABLE public.compliance_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance own all" ON public.compliance_docs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "compliance admin read" ON public.compliance_docs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "compliance admin update" ON public.compliance_docs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "compliance contractor read team" ON public.compliance_docs FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.labour_payments lp
    JOIN public.contractor_profiles cp ON cp.id = lp.contractor_id
    WHERE lp.labour_id = compliance_docs.user_id AND cp.user_id = auth.uid()
  )
);
CREATE TRIGGER compliance_docs_touch BEFORE UPDATE ON public.compliance_docs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  details text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fraud_flags TO authenticated;
GRANT ALL ON public.fraud_flags TO service_role;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flag read" ON public.fraud_flags FOR SELECT TO authenticated USING (
  subject_id = auth.uid()
  OR public.is_job_contractor(job_id, auth.uid())
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "flag admin write" ON public.fraud_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit insert self" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "site proofs read auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'site-proofs');
CREATE POLICY "site proofs auth upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "site proofs owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE public.site_checkins REPLICA IDENTITY FULL;
ALTER TABLE public.site_proofs REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_checkins;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_proofs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
