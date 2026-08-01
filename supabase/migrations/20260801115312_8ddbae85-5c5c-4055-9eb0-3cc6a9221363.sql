CREATE TABLE public.worker_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  skill TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT,
  price_per_day INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '4 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_availability TO authenticated;
GRANT ALL ON public.worker_availability TO service_role;

ALTER TABLE public.worker_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own availability"
  ON public.worker_availability FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can view active availability"
  ON public.worker_availability FOR SELECT TO authenticated
  USING (expires_at > now());

CREATE TRIGGER trg_worker_availability_updated
  BEFORE UPDATE ON public.worker_availability
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_worker_availability_expires ON public.worker_availability (expires_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_availability;

CREATE TABLE public.contractor_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contractor_plans TO authenticated;
GRANT ALL ON public.contractor_plans TO service_role;

ALTER TABLE public.contractor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors manage own plan"
  ON public.contractor_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all plans"
  ON public.contractor_plans FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_contractor_plans_updated
  BEFORE UPDATE ON public.contractor_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();