
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS aadhaar_last4 text,
  ADD COLUMN IF NOT EXISTS eshram_number text,
  ADD COLUMN IF NOT EXISTS bank_branch text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS id_card_number text,
  ADD COLUMN IF NOT EXISTS id_card_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_complete boolean NOT NULL DEFAULT false;

-- Allow anonymous read of limited public profile info via a security-definer function (avoids exposing all columns)
CREATE OR REPLACE FUNCTION public.get_public_worker(_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  location text,
  profile_photo_url text,
  id_card_number text,
  upi_id text,
  rating_avg numeric,
  rating_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name,
         -- mask phone: show only last 4
         CASE WHEN p.phone IS NULL THEN NULL
              ELSE 'XXXXXX' || RIGHT(p.phone, 4) END,
         p.location, p.profile_photo_url, p.id_card_number, p.upi_id,
         p.rating_avg, p.rating_count, p.created_at
  FROM public.profiles p
  WHERE p.id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_public_worker(uuid) TO anon, authenticated;

-- Also expose worker skill from labour_profiles
CREATE OR REPLACE FUNCTION public.get_public_worker_skill(_user_id uuid)
RETURNS TABLE (skill text, experience_years integer, price_per_day integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lp.skill, lp.experience_years, lp.price_per_day
  FROM public.labour_profiles lp
  WHERE lp.user_id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_public_worker_skill(uuid) TO anon, authenticated;
