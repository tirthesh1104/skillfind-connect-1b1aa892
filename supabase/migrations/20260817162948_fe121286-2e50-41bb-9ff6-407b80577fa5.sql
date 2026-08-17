CREATE OR REPLACE FUNCTION public.is_my_worker(_worker_id uuid, _contractor_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.labour_payments lp
    WHERE lp.labour_id = _worker_id AND lp.contractor_id = _contractor_uid
  ) OR EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.worker_id = _worker_id AND wo.contractor_id = _contractor_uid
  ) OR EXISTS (
    SELECT 1
    FROM public.requests r
    JOIN public.contractor_profiles cp ON cp.id = r.contractor_id
    JOIN public.labour_profiles lprof ON lprof.id = r.labour_id
    WHERE cp.user_id = _contractor_uid
      AND lprof.user_id = _worker_id
      AND r.status = 'accepted'
  )
$$;

CREATE POLICY "checkin contractor read own workers"
ON public.site_checkins FOR SELECT TO authenticated
USING (public.is_my_worker(worker_id, auth.uid()));