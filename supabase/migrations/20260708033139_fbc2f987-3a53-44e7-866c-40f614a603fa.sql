
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  quantity NUMERIC NOT NULL DEFAULT 0,
  used NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials owner all" ON public.materials FOR ALL TO authenticated
  USING (contractor_id = auth.uid()) WITH CHECK (contractor_id = auth.uid());
CREATE POLICY "materials admin view" ON public.materials FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "materials worker view" ON public.materials FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.labour_payments lp WHERE lp.job_id = materials.job_id AND lp.labour_id = auth.uid()));
CREATE TRIGGER trg_materials_upd BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.sub_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  scope_of_work TEXT,
  agreed_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sub_contractors TO authenticated;
GRANT ALL ON public.sub_contractors TO service_role;
ALTER TABLE public.sub_contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subc owner all" ON public.sub_contractors FOR ALL TO authenticated
  USING (contractor_id = auth.uid()) WITH CHECK (contractor_id = auth.uid());
CREATE POLICY "subc admin view" ON public.sub_contractors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subc_upd BEFORE UPDATE ON public.sub_contractors FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  client_approved BOOLEAN NOT NULL DEFAULT false,
  client_approved_at TIMESTAMPTZ,
  client_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT ALL ON public.milestones TO service_role;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms owner all" ON public.milestones FOR ALL TO authenticated
  USING (contractor_id = auth.uid()) WITH CHECK (contractor_id = auth.uid());
CREATE POLICY "ms admin view" ON public.milestones FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "ms worker view" ON public.milestones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.labour_payments lp WHERE lp.job_id = milestones.job_id AND lp.labour_id = auth.uid()));
CREATE TRIGGER trg_ms_upd BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
