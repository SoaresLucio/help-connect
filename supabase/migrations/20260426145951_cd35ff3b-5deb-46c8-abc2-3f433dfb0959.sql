
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_category ON public.help_requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_city ON public.help_requests(city);
CREATE INDEX IF NOT EXISTS idx_requests_created ON public.help_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_category ON public.help_offers(category);
CREATE INDEX IF NOT EXISTS idx_offers_city ON public.help_offers(city);
CREATE INDEX IF NOT EXISTS idx_apps_owner ON public.applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_apps_candidate ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_apps_target ON public.applications(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.chat_messages(thread_id, created_at);
