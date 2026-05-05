
DO $$
DECLARE
  pw text := crypt('demo1234', gen_salt('bf'));
BEGIN
  -- Contractors
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change) VALUES
    ('11111111-1111-1111-1111-111111111101','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ramesh.demo@example.com',pw,now(),now(),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Ramesh Kumar","phone":"9876500001","location":"Pune, MH","role":"contractor","company_name":"Ramesh Constructions"}', false,'','','',''),
    ('11111111-1111-1111-1111-111111111102','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sunil.demo@example.com',pw,now(),now(),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Sunil Patil","phone":"9876500002","location":"Mumbai, MH","role":"contractor","company_name":"Patil Builders"}', false,'','','',''),
    ('11111111-1111-1111-1111-111111111103','00000000-0000-0000-0000-000000000000','authenticated','authenticated','anil.demo@example.com',pw,now(),now(),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Anil Sharma","phone":"9876500003","location":"Nagpur, MH","role":"contractor","company_name":"Sharma Infra"}', false,'','','',''),
    -- Labourers
    ('22222222-2222-2222-2222-222222222201','00000000-0000-0000-0000-000000000000','authenticated','authenticated','mahesh.demo@example.com',pw,now(),now(),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Mahesh Pawar","phone":"9876600001","location":"Pune, MH","role":"labour","skill":"Plumber","price_per_day":650,"experience_years":5}', false,'','','',''),
    ('22222222-2222-2222-2222-222222222202','00000000-0000-0000-0000-000000000000','authenticated','authenticated','suresh.demo@example.com',pw,now(),now(),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Suresh Yadav","phone":"9876600002","location":"Pune, MH","role":"labour","skill":"Electrician","price_per_day":800,"experience_years":7}', false,'','','',''),
    ('22222222-2222-2222-2222-222222222203','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ravi.demo@example.com',pw,now(),now(),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Ravi Verma","phone":"9876600003","location":"Mumbai, MH","role":"labour","skill":"Mason","price_per_day":700,"experience_years":4}', false,'','','',''),
    ('22222222-2222-2222-2222-222222222204','00000000-0000-0000-0000-000000000000','authenticated','authenticated','dinesh.demo@example.com',pw,now(),now(),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Dinesh Singh","phone":"9876600004","location":"Nagpur, MH","role":"labour","skill":"Carpenter","price_per_day":750,"experience_years":6}', false,'','','',''),
    ('22222222-2222-2222-2222-222222222205','00000000-0000-0000-0000-000000000000','authenticated','authenticated','vikas.demo@example.com',pw,now(),now(),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Vikas More","phone":"9876600005","location":"Pune, MH","role":"labour","skill":"Painter","price_per_day":600,"experience_years":3}', false,'','','','')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Tweak some pin codes & flags
UPDATE profiles SET pin_code='411001' WHERE id='11111111-1111-1111-1111-111111111101';
UPDATE profiles SET pin_code='400001' WHERE id='11111111-1111-1111-1111-111111111102';
UPDATE profiles SET pin_code='440001' WHERE id='11111111-1111-1111-1111-111111111103';
UPDATE labour_profiles SET is_available=false WHERE user_id='22222222-2222-2222-2222-222222222204';
UPDATE contractor_profiles SET total_hired_today=2, max_labour_per_day=8 WHERE user_id='11111111-1111-1111-1111-111111111101';
UPDATE contractor_profiles SET total_hired_today=1, max_labour_per_day=6 WHERE user_id='11111111-1111-1111-1111-111111111102';
UPDATE contractor_profiles SET total_hired_today=4, max_labour_per_day=10 WHERE user_id='11111111-1111-1111-1111-111111111103';
