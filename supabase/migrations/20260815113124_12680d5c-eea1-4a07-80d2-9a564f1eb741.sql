ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_email text;

ALTER TABLE public.sos_alerts
  ADD COLUMN IF NOT EXISTS whatsapp_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notify_detail text;