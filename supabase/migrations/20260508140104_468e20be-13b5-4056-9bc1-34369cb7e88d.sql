
WITH targets AS (
  SELECT user_id FROM public.user_roles WHERE role IN ('contractor','labour')
)
DELETE FROM public.notifications WHERE user_id IN (SELECT user_id FROM targets);

DELETE FROM public.ratings WHERE given_to IN (SELECT user_id FROM public.user_roles WHERE role IN ('contractor','labour'))
   OR given_by IN (SELECT user_id FROM public.user_roles WHERE role IN ('contractor','labour'));

DELETE FROM public.disputes WHERE raised_by IN (SELECT user_id FROM public.user_roles WHERE role IN ('contractor','labour'))
   OR against_user IN (SELECT user_id FROM public.user_roles WHERE role IN ('contractor','labour'));

DELETE FROM public.insurance_claims WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role IN ('contractor','labour'));
DELETE FROM public.insurance_pool WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role IN ('contractor','labour'));

DELETE FROM public.wage_agreements;
DELETE FROM public.requests;
DELETE FROM public.jobs;

DELETE FROM public.contractor_profiles;
DELETE FROM public.labour_profiles;

DELETE FROM auth.users WHERE id IN (SELECT user_id FROM public.user_roles WHERE role IN ('contractor','labour'));
DELETE FROM public.user_roles WHERE role IN ('contractor','labour');
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
