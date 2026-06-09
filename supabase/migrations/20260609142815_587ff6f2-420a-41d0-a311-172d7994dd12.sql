
-- Add 'client' to app_role enum (additive, idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'client';
  END IF;
END $$;

-- Client profile table
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text,
  project_type text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_profiles TO authenticated;
GRANT ALL ON public.client_profiles TO service_role;

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own profile" ON public.client_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can view client profiles" ON public.client_profiles
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Update handle_new_user to also create client_profiles row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _meta_role text;
  _full_name TEXT;
  _phone TEXT;
  _location TEXT;
  _company_name TEXT;
  _skill TEXT;
  _price INTEGER;
  _exp INTEGER;
  _project_type TEXT;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1));
  _phone := NEW.raw_user_meta_data ->> 'phone';
  _location := COALESCE(NEW.raw_user_meta_data ->> 'location', '');
  _meta_role := NEW.raw_user_meta_data ->> 'role';
  _role := CASE
    WHEN _meta_role IN ('contractor','labour','client') THEN _meta_role::app_role
    ELSE 'labour'::app_role
  END;

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
  ELSIF _role = 'client' THEN
    _company_name := NEW.raw_user_meta_data ->> 'company_name';
    _project_type := NEW.raw_user_meta_data ->> 'project_type';
    INSERT INTO public.client_profiles (user_id, company_name, project_type, location)
    VALUES (NEW.id, _company_name, _project_type, _location);
  END IF;

  RETURN NEW;
END;
$$;
