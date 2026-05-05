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
    WHEN _meta_role IN ('contractor','labour') THEN _meta_role::app_role
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