-- Remove ability for end users to insert notifications directly
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;

-- Restrict help_requests SELECT to authenticated users (contains lat/lng)
DROP POLICY IF EXISTS "Requests viewable by everyone" ON public.help_requests;
CREATE POLICY "Requests viewable by authenticated users"
ON public.help_requests
FOR SELECT
TO authenticated
USING (true);