
CREATE POLICY "letters own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'appointment-letters' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "letters own write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'appointment-letters' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "letters own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'appointment-letters' AND auth.uid()::text = (storage.foldername(name))[1]);
