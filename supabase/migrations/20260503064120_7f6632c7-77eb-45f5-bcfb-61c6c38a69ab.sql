
-- 1) Fix handle_new_user: never honor admin from user metadata
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
  -- Only contractor / labour are accepted from client metadata. Admin must be granted manually.
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

-- 2) Tighten user_roles INSERT: never allow self-assigning admin
DROP POLICY IF EXISTS "System inserts on signup" ON public.user_roles;
CREATE POLICY "Self insert non-admin or admin grants any"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (auth.uid() = user_id AND role IN ('contractor','labour'))
  );

-- 3) Profiles: hide sensitive columns from other users
-- Owner & admin can see everything via row-level; sensitive columns are revoked from authenticated
-- meaning when other users read profiles they cannot see those columns.
-- But owner/admin SELECT also goes through column grants. So we use column-level grants combined
-- with a SECURITY DEFINER function for owners/admins to fetch full record.

REVOKE SELECT (phone, pin_code, work_passport_token) ON public.profiles FROM anon, authenticated;

-- Function for any user to fetch their OWN full profile (including sensitive cols)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

-- Function for admins to fetch full profile of any user
CREATE OR REPLACE FUNCTION public.admin_get_profile(_user_id uuid)
RETURNS public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN (SELECT p FROM public.profiles p WHERE p.id = _user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_profile(uuid) TO authenticated;

-- 4) Notifications: restrict INSERT to recipient/admin/related parties only
DROP POLICY IF EXISTS "Users insert notifications for self or admin" ON public.notifications;
CREATE POLICY "Notifications insert restricted to related parties"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.requests r
      JOIN public.contractor_profiles cp ON cp.id = r.contractor_id
      JOIN public.labour_profiles lp ON lp.id = r.labour_id
      WHERE (cp.user_id = auth.uid() AND lp.user_id = notifications.user_id)
         OR (lp.user_id = auth.uid() AND cp.user_id = notifications.user_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.wage_agreements wa
      JOIN public.contractor_profiles cp ON cp.id = wa.contractor_id
      JOIN public.labour_profiles lp ON lp.id = wa.labour_id
      WHERE (cp.user_id = auth.uid() AND lp.user_id = notifications.user_id)
         OR (lp.user_id = auth.uid() AND cp.user_id = notifications.user_id)
    )
  );

-- 5) Restrict execute on internal helper functions to admins (still work inside RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO service_role;

-- 6) Server-side admin verification table (replaces sessionStorage gate)
CREATE TABLE IF NOT EXISTS public.admin_verifications (
  user_id uuid PRIMARY KEY,
  verified_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_verifications ENABLE ROW LEVEL SECURITY;

-- Only the user themself can read their verification row.
CREATE POLICY "User can read own admin verification"
  ON public.admin_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies = clients cannot write. Only service role (edge function) can.
