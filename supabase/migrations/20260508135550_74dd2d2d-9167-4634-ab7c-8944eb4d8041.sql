
-- Delete demo seed users (cascade clears related rows via app references)
DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.ratings WHERE given_to IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com') OR given_by IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.disputes WHERE raised_by IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com') OR against_user IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.insurance_claims WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.insurance_pool WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.wage_agreements WHERE contractor_id IN (SELECT id FROM public.contractor_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com'))
  OR labour_id IN (SELECT id FROM public.labour_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com'));
DELETE FROM public.requests WHERE contractor_id IN (SELECT id FROM public.contractor_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com'))
  OR labour_id IN (SELECT id FROM public.labour_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com'));
DELETE FROM public.jobs WHERE contractor_id IN (SELECT id FROM public.contractor_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com'));
DELETE FROM public.contractor_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.labour_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.admin_verifications WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%.demo@example.com');
DELETE FROM auth.users WHERE email LIKE '%.demo@example.com';

-- Allow users to delete their own admin verification row (so we can clear it on every login)
CREATE POLICY "User can delete own admin verification"
ON public.admin_verifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
