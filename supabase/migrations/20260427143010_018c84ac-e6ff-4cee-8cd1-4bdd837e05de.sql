
-- ============================================================
-- 1) PROFILES: restrict sensitive PII; public view for safe data
-- ============================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own full profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Public-safe view (no PII)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT
  user_id,
  full_name,
  display_name,
  avatar_url,
  bio,
  city,
  state,
  neighborhood,
  interests,
  identity_verified,
  rating_avg,
  reviews_count,
  company_name,
  created_at
FROM public.profiles;

-- Allow public/auth read on the safe view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- We need authenticated users to still be able to read safe columns of OTHER users
-- via the base table for joins (e.g. help_requests join author). To avoid leaking PII
-- through joined SELECT *, we add a second policy returning safe rows for authenticated
-- users — but RLS is row-level, not column-level. So instead: restrict join queries
-- to use profiles_public for non-owners. The base table policy above limits raw access
-- to owner only. Joins like "author:profiles!fk(*)" will now only return rows for the
-- viewer's own profile, which would break the feed. Instead, allow authenticated read
-- on base table but rely on application code to never select sensitive columns.
-- We choose the safer hybrid: keep base table owner-only and switch joins to the view.

-- ============================================================
-- 2) USER_ROLES: prevent self-admin; private role visibility
-- ============================================================
DROP POLICY IF EXISTS "Users manage own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Roles viewable by everyone" ON public.user_roles;

CREATE POLICY "Users insert own non-admin roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role <> 'admin');

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 3) PAYMENTS: only payer can update (status changes go via edge function w/ service role)
-- ============================================================
DROP POLICY IF EXISTS "Payer or payee updates" ON public.payments;
CREATE POLICY "Payer updates payment"
  ON public.payments FOR UPDATE
  USING (auth.uid() = payer_id);

-- ============================================================
-- 4) Lock down SECURITY DEFINER helpers from API exposure
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.refresh_profile_rating() FROM anon, authenticated, public;
-- has_role is needed inside RLS policies (called via SQL), but should NOT be callable by clients
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;

-- ============================================================
-- 5) Storage: stop allowing bucket listing for public buckets
--    (Files remain accessible via their public URLs.)
-- ============================================================
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read portfolios" ON storage.objects;
DROP POLICY IF EXISTS "Public read request images" ON storage.objects;
