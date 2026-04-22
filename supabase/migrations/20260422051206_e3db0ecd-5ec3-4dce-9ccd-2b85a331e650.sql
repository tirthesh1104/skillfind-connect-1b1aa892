
-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('admin', 'contractor', 'labour');
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.job_status AS ENUM ('open', 'closed');
CREATE TYPE public.notification_type AS ENUM ('request', 'accepted', 'rejected', 'system');

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============== USER ROLES (separate table — security best practice) ==============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get a user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ============== LABOUR PROFILES ==============
CREATE TABLE public.labour_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  price_per_day INTEGER NOT NULL DEFAULT 0,
  experience_years INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.labour_profiles ENABLE ROW LEVEL SECURITY;

-- ============== CONTRACTOR PROFILES ==============
CREATE TABLE public.contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  max_labour_per_day INTEGER NOT NULL DEFAULT 5,
  total_hired_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;

-- ============== JOBS ==============
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  work_type TEXT NOT NULL,
  location TEXT NOT NULL,
  price_offered INTEGER NOT NULL DEFAULT 0,
  required_skill TEXT NOT NULL,
  description TEXT,
  status job_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- ============== REQUESTS ==============
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  labour_id UUID NOT NULL REFERENCES public.labour_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  status request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  initiated_by app_role NOT NULL DEFAULT 'contractor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- ============== NOTIFICATIONS ==============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  type notification_type NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES: anyone authenticated can view (needed to display labour names etc.); only owner or admin can modify
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES: users can read their own; admins read all; only admins manage (role assigned via signup trigger for new users)
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts on signup"
  ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- LABOUR_PROFILES: viewable by authenticated; owner or admin can modify
CREATE POLICY "Labour profiles viewable by authenticated"
  ON public.labour_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Labour can insert own"
  ON public.labour_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Labour can update own"
  ON public.labour_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete labour profiles"
  ON public.labour_profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- CONTRACTOR_PROFILES
CREATE POLICY "Contractor profiles viewable by authenticated"
  ON public.contractor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Contractor can insert own"
  ON public.contractor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Contractor can update own"
  ON public.contractor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete contractor profiles"
  ON public.contractor_profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- JOBS: all authenticated can view; only owning contractor or admin manages
CREATE POLICY "Jobs viewable by authenticated"
  ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Contractor can insert jobs"
  ON public.jobs FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id = contractor_id AND cp.user_id = auth.uid())
  );
CREATE POLICY "Contractor can update own jobs"
  ON public.jobs FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id = contractor_id AND cp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Contractor or admin can delete jobs"
  ON public.jobs FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id = contractor_id AND cp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- REQUESTS: visible to involved contractor, involved labour, or admin
CREATE POLICY "Requests viewable by involved parties"
  ON public.requests FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id = contractor_id AND cp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.labour_profiles lp WHERE lp.id = labour_id AND lp.user_id = auth.uid())
  );
CREATE POLICY "Involved parties can create requests"
  ON public.requests FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id = contractor_id AND cp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.labour_profiles lp WHERE lp.id = labour_id AND lp.user_id = auth.uid())
  );
CREATE POLICY "Involved parties can update requests"
  ON public.requests FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id = contractor_id AND cp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.labour_profiles lp WHERE lp.id = labour_id AND lp.user_id = auth.uid())
  );
CREATE POLICY "Admin or owner deletes requests"
  ON public.requests FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.contractor_profiles cp WHERE cp.id = contractor_id AND cp.user_id = auth.uid())
  );

-- NOTIFICATIONS: only owner can read/update; system inserts via service or signed-in users
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGERS
-- ============================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER labour_profiles_touch BEFORE UPDATE ON public.labour_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER contractor_profiles_touch BEFORE UPDATE ON public.contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER jobs_touch BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER requests_touch BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + role on auth signup, using metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _full_name TEXT;
  _phone TEXT;
  _location TEXT;
  _company_name TEXT;
  _skill TEXT;
  _price INTEGER;
  _exp INTEGER;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1));
  _phone := NEW.raw_user_meta_data ->> 'phone';
  _location := COALESCE(NEW.raw_user_meta_data ->> 'location', '');
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'labour');

  INSERT INTO public.profiles (id, full_name, phone, location)
  VALUES (NEW.id, _full_name, _phone, _location);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  IF _role = 'contractor' THEN
    _company_name := COALESCE(NEW.raw_user_meta_data ->> 'company_name', _full_name || '''s Co.');
    INSERT INTO public.contractor_profiles (user_id, company_name)
    VALUES (NEW.id, _company_name);
  ELSIF _role = 'labour' THEN
    _skill := COALESCE(NEW.raw_user_meta_data ->> 'skill', 'General');
    _price := COALESCE((NEW.raw_user_meta_data ->> 'price_per_day')::int, 0);
    _exp := COALESCE((NEW.raw_user_meta_data ->> 'experience_years')::int, 0);
    INSERT INTO public.labour_profiles (user_id, skill, price_per_day, experience_years)
    VALUES (NEW.id, _skill, _price, _exp);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.requests REPLICA IDENTITY FULL;
