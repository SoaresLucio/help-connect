
-- 1) Realtime subscription access control
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive own notifications realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can receive own applications realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can receive chat thread realtime" ON realtime.messages;

CREATE POLICY "Authenticated can receive own notifications realtime"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'notifications:' || auth.uid()::text || '%'
);

CREATE POLICY "Authenticated can receive own applications realtime"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = 'applications:' || auth.uid()::text
);

CREATE POLICY "Authenticated can receive chat thread realtime"
ON realtime.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_threads t
    WHERE ('chat:' || t.id::text) = realtime.topic()
      AND (t.participant_a = auth.uid() OR t.participant_b = auth.uid())
  )
);

-- 2) Recreate safe public profile view (drop + create so columns can change)
DROP VIEW IF EXISTS public.profiles_public CASCADE;

CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT
  user_id,
  display_name,
  full_name,
  avatar_url,
  bio,
  city,
  state,
  neighborhood,
  rating_avg,
  reviews_count,
  identity_verified,
  interests,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;
