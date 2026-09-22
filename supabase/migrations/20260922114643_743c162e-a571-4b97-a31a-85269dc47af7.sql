DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['daily_tasks','milestones','materials','sub_contractors','jobs','labour_payments','payment_history'] LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;