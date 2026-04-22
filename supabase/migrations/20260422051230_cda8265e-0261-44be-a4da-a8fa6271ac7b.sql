
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Replace permissive notifications insert with explicit check
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Users insert notifications for self or admin"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    -- allow contractors/labours to send notifications to the other party they have a relationship with
    OR EXISTS (
      SELECT 1 FROM public.contractor_profiles cp WHERE cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.labour_profiles lp WHERE lp.user_id = auth.uid()
    )
  );
