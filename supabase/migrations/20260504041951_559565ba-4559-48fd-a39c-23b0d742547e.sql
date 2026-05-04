-- 1) Update signup trigger to accept the admin role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1));
  _phone := NEW.raw_user_meta_data ->> 'phone';
  _location := COALESCE(NEW.raw_user_meta_data ->> 'location', '');
  _meta_role := NEW.raw_user_meta_data ->> 'role';
  _role := CASE
    WHEN _meta_role IN ('admin','contractor','labour') THEN _meta_role::app_role
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
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Allow self-admin INSERT (signup path). Admin dashboard is still gated by the secret key.
DROP POLICY IF EXISTS "Self insert non-admin or admin grants any" ON public.user_roles;
CREATE POLICY "Self insert role on signup"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3) Confirm any unconfirmed users so existing logins work
UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email_confirmed_at IS NULL;

-- 4) Wipe app data (keeps schema, policies, functions, triggers intact)
TRUNCATE TABLE
  public.notifications,
  public.disputes,
  public.insurance_claims,
  public.insurance_pool,
  public.ratings,
  public.wage_agreements,
  public.requests,
  public.jobs,
  public.labour_profiles,
  public.contractor_profiles,
  public.admin_verifications,
  public.user_roles,
  public.profiles
RESTART IDENTITY CASCADE;

-- 5) Remove old auth users so sign-ups start clean
DELETE FROM auth.users;
