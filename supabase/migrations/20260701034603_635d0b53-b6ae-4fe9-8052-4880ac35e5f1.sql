
-- APPOINTMENT LETTERS
CREATE TABLE public.appointment_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_letters TO authenticated;
GRANT ALL ON public.appointment_letters TO service_role;
ALTER TABLE public.appointment_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "letters read parties" ON public.appointment_letters FOR SELECT TO authenticated
  USING (auth.uid() = worker_id OR auth.uid() = contractor_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "letters contractor insert" ON public.appointment_letters FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = contractor_id);
CREATE POLICY "letters contractor update" ON public.appointment_letters FOR UPDATE TO authenticated
  USING (auth.uid() = contractor_id OR auth.uid() = worker_id);

-- MINIMUM WAGES
CREATE TABLE public.minimum_wages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  skill_category TEXT NOT NULL,
  wage_per_day INTEGER NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(state, skill_category)
);
GRANT SELECT ON public.minimum_wages TO authenticated, anon;
GRANT ALL ON public.minimum_wages TO service_role;
ALTER TABLE public.minimum_wages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wages public read" ON public.minimum_wages FOR SELECT USING (true);
CREATE POLICY "wages admin write" ON public.minimum_wages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.minimum_wages (state, skill_category, wage_per_day) VALUES
  ('Maharashtra','Unskilled',480),
  ('Maharashtra','Semi-skilled',540),
  ('Maharashtra','Skilled',620),
  ('Maharashtra','Highly Skilled',720);

-- ADVANCES
CREATE TABLE public.advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  repayment_type TEXT NOT NULL DEFAULT 'one-time',
  installment_amount INTEGER DEFAULT 0,
  weeks INTEGER DEFAULT 0,
  total_repaid INTEGER NOT NULL DEFAULT 0,
  balance INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  agreed_by_worker BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advances TO authenticated;
GRANT ALL ON public.advances TO service_role;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advances read parties" ON public.advances FOR SELECT TO authenticated
  USING (auth.uid() = worker_id OR auth.uid() = contractor_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "advances contractor insert" ON public.advances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = contractor_id);
CREATE POLICY "advances update parties" ON public.advances FOR UPDATE TO authenticated
  USING (auth.uid() = contractor_id OR auth.uid() = worker_id);
