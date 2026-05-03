
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recompute_user_rating() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
