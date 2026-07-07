
-- Daily Tasks
CREATE TABLE public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  job_id uuid,
  task_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_tasks TO authenticated;
GRANT ALL ON public.daily_tasks TO service_role;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractor manages own tasks" ON public.daily_tasks
  FOR ALL TO authenticated
  USING (contractor_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (contractor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "worker sees own tasks" ON public.daily_tasks
  FOR SELECT TO authenticated USING (worker_id = auth.uid());
CREATE POLICY "worker marks own task complete" ON public.daily_tasks
  FOR UPDATE TO authenticated USING (worker_id = auth.uid()) WITH CHECK (worker_id = auth.uid());

CREATE TRIGGER trg_daily_tasks_updated BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Work Orders
CREATE TABLE public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  job_id uuid,
  description text NOT NULL,
  duration_days integer NOT NULL DEFAULT 1,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  start_date date,
  status text NOT NULL DEFAULT 'draft',
  contractor_signed_at timestamptz,
  worker_signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_orders TO authenticated;
GRANT ALL ON public.work_orders TO service_role;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractor manages own work orders" ON public.work_orders
  FOR ALL TO authenticated
  USING (contractor_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (contractor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "worker sees own work orders" ON public.work_orders
  FOR SELECT TO authenticated USING (worker_id = auth.uid());
CREATE POLICY "worker signs own work order" ON public.work_orders
  FOR UPDATE TO authenticated USING (worker_id = auth.uid()) WITH CHECK (worker_id = auth.uid());

CREATE TRIGGER trg_work_orders_updated BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Daily Progress Reports
CREATE TABLE public.dpr_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  job_id uuid,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  workers_present integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  tasks_total integer DEFAULT 0,
  materials_used text,
  issues text,
  notes text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dpr_reports TO authenticated;
GRANT ALL ON public.dpr_reports TO service_role;
ALTER TABLE public.dpr_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractor manages own dpr" ON public.dpr_reports
  FOR ALL TO authenticated
  USING (contractor_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (contractor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_dpr_updated BEFORE UPDATE ON public.dpr_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
