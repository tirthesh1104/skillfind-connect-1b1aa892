-- 1. e-Shram verification
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS eshram_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eshram_verified_at timestamptz;

-- 3. geofence fields on jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS site_lat double precision,
  ADD COLUMN IF NOT EXISTS site_lng double precision,
  ADD COLUMN IF NOT EXISTS geofence_radius_m integer NOT NULL DEFAULT 200;

-- 9. skill badges
CREATE TABLE public.worker_skill_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  skill_name text NOT NULL,
  badge_level text NOT NULL DEFAULT 'Verified',
  certified_by uuid,
  certified_at timestamptz NOT NULL DEFAULT now(),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.worker_skill_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_skill_badges TO authenticated;
GRANT ALL ON public.worker_skill_badges TO service_role;
ALTER TABLE public.worker_skill_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges readable by all" ON public.worker_skill_badges FOR SELECT USING (true);
CREATE POLICY "admins manage badges" ON public.worker_skill_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9b. training videos
CREATE TABLE public.training_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_url text NOT NULL,
  skill_category text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.training_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_videos TO authenticated;
GRANT ALL ON public.training_videos TO service_role;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos readable by all" ON public.training_videos FOR SELECT USING (true);
CREATE POLICY "admins manage videos" ON public.training_videos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. escrow
CREATE TABLE public.wage_escrow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  contractor_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'held',
  worker_marked_complete_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wage_escrow TO authenticated;
GRANT ALL ON public.wage_escrow TO service_role;
ALTER TABLE public.wage_escrow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escrow parties read" ON public.wage_escrow FOR SELECT TO authenticated
  USING (contractor_id = auth.uid() OR worker_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "contractor creates escrow" ON public.wage_escrow FOR INSERT TO authenticated
  WITH CHECK (contractor_id = auth.uid());
CREATE POLICY "parties update escrow" ON public.wage_escrow FOR UPDATE TO authenticated
  USING (contractor_id = auth.uid() OR worker_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_wage_escrow_updated BEFORE UPDATE ON public.wage_escrow
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3b. geofenced attendance
CREATE TABLE public.site_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  contractor_id uuid,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  check_out_time timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  distance_m integer,
  is_within_geofence boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.site_attendance TO authenticated;
GRANT ALL ON public.site_attendance TO service_role;
ALTER TABLE public.site_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance read" ON public.site_attendance FOR SELECT TO authenticated
  USING (worker_id = auth.uid() OR contractor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "worker inserts attendance" ON public.site_attendance FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid());
CREATE POLICY "worker updates own attendance" ON public.site_attendance FOR UPDATE TO authenticated
  USING (worker_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));