
-- Ratings: add optional tags column (additive)
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

-- SOS Alerts
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  latitude numeric,
  longitude numeric,
  address text,
  status text NOT NULL DEFAULT 'active',
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sos_alerts TO authenticated;
GRANT ALL ON public.sos_alerts TO service_role;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worker insert own sos" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "worker see own sos" ON public.sos_alerts FOR SELECT TO authenticated USING (auth.uid() = worker_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update sos" ON public.sos_alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Completion Certificates
CREATE TABLE IF NOT EXISTS public.completion_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  worker_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  certificate_number text NOT NULL UNIQUE,
  job_title text,
  site_name text,
  start_date date,
  end_date date,
  skills text,
  contractor_name text,
  worker_name text,
  issued_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.completion_certificates TO authenticated;
GRANT ALL ON public.completion_certificates TO service_role;
ALTER TABLE public.completion_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert view own" ON public.completion_certificates FOR SELECT TO authenticated USING (auth.uid() = worker_id OR auth.uid() = contractor_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "contractor issues cert" ON public.completion_certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = contractor_id);
