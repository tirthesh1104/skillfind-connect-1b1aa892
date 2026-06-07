
CREATE POLICY "payment_proofs_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs' AND (
      public.has_role(auth.uid(),'admin')
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.payment_proofs pp
        WHERE pp.proof_url LIKE '%' || storage.objects.name
          AND (pp.labour_id = auth.uid() OR pp.contractor_id = auth.uid())
      )
    )
  );

CREATE POLICY "payment_proofs_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
