-- 17. Contractor KYC
ALTER TABLE public.contractor_profiles
  ADD COLUMN IF NOT EXISTS business_registration_number text,
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_document_url text,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamptz;

DROP POLICY IF EXISTS "Admins can update contractor kyc" ON public.contractor_profiles;
CREATE POLICY "Admins can update contractor kyc"
ON public.contractor_profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 18. Before/after work photo proof
CREATE TABLE IF NOT EXISTS public.job_work_proof (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('before','after')),
  photo_url text NOT NULL,
  caption text,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_work_proof TO authenticated;
GRANT ALL ON public.job_work_proof TO service_role;
ALTER TABLE public.job_work_proof ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uploader manages own work proof"
ON public.job_work_proof FOR ALL TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Job contractor views work proof"
ON public.job_work_proof FOR SELECT TO authenticated
USING (job_id IS NOT NULL AND public.is_job_contractor(job_id, auth.uid()));

CREATE POLICY "Admins view all work proof"
ON public.job_work_proof FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 19. Wage advance requests
CREATE TABLE IF NOT EXISTS public.wage_advance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  requested_amount integer NOT NULL CHECK (requested_amount > 0),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','repaid')),
  decision_note text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  repaid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wage_advance_requests TO authenticated;
GRANT ALL ON public.wage_advance_requests TO service_role;
ALTER TABLE public.wage_advance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own advance requests"
ON public.wage_advance_requests FOR ALL TO authenticated
USING (worker_id = auth.uid())
WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Contractors view advance requests to them"
ON public.wage_advance_requests FOR SELECT TO authenticated
USING (contractor_id = auth.uid());

CREATE POLICY "Contractors decide advance requests to them"
ON public.wage_advance_requests FOR UPDATE TO authenticated
USING (contractor_id = auth.uid())
WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Admins view all advance requests"
ON public.wage_advance_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_wage_advance_requests_updated
BEFORE UPDATE ON public.wage_advance_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 22. Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  endpoint text NOT NULL,
  subscription jsonb,
  radius_km integer NOT NULL DEFAULT 10,
  lat double precision,
  lng double precision,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, endpoint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own push subscriptions"
ON public.push_subscriptions FOR ALL TO authenticated
USING (worker_id = auth.uid())
WITH CHECK (worker_id = auth.uid());

CREATE TRIGGER trg_push_subscriptions_updated
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();