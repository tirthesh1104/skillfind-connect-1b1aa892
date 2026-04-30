
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_code TEXT,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS work_passport_token TEXT UNIQUE;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS pin_code TEXT,
  ADD COLUMN IF NOT EXISTS wage_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS link TEXT;

CREATE TABLE IF NOT EXISTS public.wage_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL,
  labour_id UUID NOT NULL,
  agreed_wage INTEGER NOT NULL,
  agreed_start_date DATE,
  agreed_duration_days INTEGER,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  is_disputed BOOLEAN NOT NULL DEFAULT false,
  contractor_confirmed BOOLEAN NOT NULL DEFAULT false,
  labour_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wage_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agreements viewable by parties or admin" ON public.wage_agreements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id=wage_agreements.contractor_id AND cp.user_id=auth.uid()) OR EXISTS (SELECT 1 FROM public.labour_profiles lp WHERE lp.id=wage_agreements.labour_id AND lp.user_id=auth.uid()));
CREATE POLICY "Parties can insert agreements" ON public.wage_agreements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id=wage_agreements.contractor_id AND cp.user_id=auth.uid()) OR EXISTS (SELECT 1 FROM public.labour_profiles lp WHERE lp.id=wage_agreements.labour_id AND lp.user_id=auth.uid()));
CREATE POLICY "Parties can update agreements" ON public.wage_agreements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id=wage_agreements.contractor_id AND cp.user_id=auth.uid()) OR EXISTS (SELECT 1 FROM public.labour_profiles lp WHERE lp.id=wage_agreements.labour_id AND lp.user_id=auth.uid()));
CREATE POLICY "Admin or contractor can delete agreements" ON public.wage_agreements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id=wage_agreements.contractor_id AND cp.user_id=auth.uid()));
CREATE TRIGGER trg_wage_agreements_updated_at BEFORE UPDATE ON public.wage_agreements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  given_by UUID NOT NULL,
  given_to UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  skill_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by all authenticated" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid()=given_by);
CREATE POLICY "Users update own ratings" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid()=given_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users delete own ratings" ON public.ratings FOR DELETE TO authenticated USING (auth.uid()=given_by OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.wage_agreements(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL,
  against_user UUID NOT NULL,
  amount_claimed INTEGER NOT NULL DEFAULT 0,
  amount_agreed INTEGER NOT NULL DEFAULT 0,
  evidence_url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Disputes viewable by parties or admin" ON public.disputes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR auth.uid()=raised_by OR auth.uid()=against_user);
CREATE POLICY "Users raise own disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (auth.uid()=raised_by);
CREATE POLICY "Admin or parties update disputes" ON public.disputes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR auth.uid()=raised_by);
CREATE POLICY "Admin deletes disputes" ON public.disputes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.insurance_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_contributed INTEGER NOT NULL DEFAULT 0,
  is_opted_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pool rows viewable by all authenticated" ON public.insurance_pool FOR SELECT TO authenticated USING (true);
CREATE POLICY "User manages own pool row" ON public.insurance_pool FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "User updates own pool row" ON public.insurance_pool FOR UPDATE TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deletes pool rows" ON public.insurance_pool FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_insurance_pool_updated_at BEFORE UPDATE ON public.insurance_pool FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  claim_amount INTEGER NOT NULL,
  description TEXT,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claims viewable by owner or admin" ON public.insurance_claims FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "User creates own claim" ON public.insurance_claims FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Admin or owner updates claim" ON public.insurance_claims FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR auth.uid()=user_id);
CREATE POLICY "Admin deletes claim" ON public.insurance_claims FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_insurance_claims_updated_at BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.recompute_user_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _avg NUMERIC; _count INTEGER; _target UUID;
BEGIN
  _target := COALESCE(NEW.given_to, OLD.given_to);
  SELECT COALESCE(AVG(score),0), COUNT(*) INTO _avg,_count FROM public.ratings WHERE given_to=_target;
  UPDATE public.profiles SET rating_avg=ROUND(_avg,2), rating_count=_count WHERE id=_target;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_recompute_rating_ins ON public.ratings;
DROP TRIGGER IF EXISTS trg_recompute_rating_upd ON public.ratings;
DROP TRIGGER IF EXISTS trg_recompute_rating_del ON public.ratings;
CREATE TRIGGER trg_recompute_rating_ins AFTER INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.recompute_user_rating();
CREATE TRIGGER trg_recompute_rating_upd AFTER UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.recompute_user_rating();
CREATE TRIGGER trg_recompute_rating_del AFTER DELETE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.recompute_user_rating();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='jobs') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs';
  END IF;
END $$;
