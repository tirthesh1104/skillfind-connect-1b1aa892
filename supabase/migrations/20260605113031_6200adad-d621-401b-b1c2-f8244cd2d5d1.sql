
-- 1. Profile UPI fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS payment_details_updated_at TIMESTAMPTZ;

-- 2. labour_payments: contractor↔labour wage ledger
CREATE TABLE IF NOT EXISTS public.labour_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labour_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  job_id UUID,
  skill TEXT,
  days_worked INTEGER NOT NULL DEFAULT 0,
  daily_rate INTEGER NOT NULL DEFAULT 0,
  amount_due INTEGER NOT NULL DEFAULT 0,
  advance_paid INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.labour_payments TO authenticated;
GRANT ALL ON public.labour_payments TO service_role;

ALTER TABLE public.labour_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "labour_payments_select_own" ON public.labour_payments
  FOR SELECT TO authenticated
  USING (
    auth.uid() = labour_id
    OR auth.uid() = contractor_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "labour_payments_insert_contractor_admin" ON public.labour_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = contractor_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "labour_payments_update_contractor_admin" ON public.labour_payments
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = contractor_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "labour_payments_delete_admin" ON public.labour_payments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER labour_payments_touch
  BEFORE UPDATE ON public.labour_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. payment_history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labour_payment_id UUID REFERENCES public.labour_payments(id) ON DELETE SET NULL,
  labour_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  payment_reference TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_history TO authenticated;
GRANT ALL ON public.payment_history TO service_role;

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_history_select_own" ON public.payment_history
  FOR SELECT TO authenticated
  USING (
    auth.uid() = labour_id
    OR auth.uid() = contractor_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "payment_history_insert_contractor_admin" ON public.payment_history
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = contractor_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "payment_history_delete_admin" ON public.payment_history
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. payment_receipts
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  payment_history_id UUID REFERENCES public.payment_history(id) ON DELETE SET NULL,
  labour_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  contractor_name TEXT,
  labour_name TEXT,
  skill TEXT,
  days_worked INTEGER DEFAULT 0,
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  upi_id TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_receipts TO authenticated;
GRANT ALL ON public.payment_receipts TO service_role;

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_receipts_select_own" ON public.payment_receipts
  FOR SELECT TO authenticated
  USING (
    auth.uid() = labour_id
    OR auth.uid() = contractor_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "payment_receipts_insert_contractor_admin" ON public.payment_receipts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = contractor_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "payment_receipts_delete_admin" ON public.payment_receipts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
