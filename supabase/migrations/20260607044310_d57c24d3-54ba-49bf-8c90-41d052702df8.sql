
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS upi_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_frequency TEXT NOT NULL DEFAULT 'Monthly';

ALTER TABLE public.labour_payments
  ADD COLUMN IF NOT EXISTS expected_payment_date DATE,
  ADD COLUMN IF NOT EXISTS payment_promise_note TEXT;

CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_history_id UUID REFERENCES public.payment_history(id) ON DELETE CASCADE,
  labour_payment_id UUID REFERENCES public.labour_payments(id) ON DELETE SET NULL,
  contractor_id UUID NOT NULL,
  labour_id UUID NOT NULL,
  proof_url TEXT NOT NULL,
  proof_type TEXT NOT NULL DEFAULT 'image',
  amount INTEGER,
  note TEXT,
  confirmed_by_labour BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payment_proofs TO authenticated;
GRANT ALL ON public.payment_proofs TO service_role;

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_proofs_select_own" ON public.payment_proofs
  FOR SELECT TO authenticated
  USING (auth.uid() = labour_id OR auth.uid() = contractor_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "payment_proofs_insert_contractor" ON public.payment_proofs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = contractor_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "payment_proofs_update_labour_admin" ON public.payment_proofs
  FOR UPDATE TO authenticated
  USING (auth.uid() = labour_id OR public.has_role(auth.uid(),'admin'));
