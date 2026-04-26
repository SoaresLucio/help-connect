
-- =========== ENUMS ===========
CREATE TYPE public.app_role AS ENUM ('freelancer', 'individual', 'company', 'admin');
CREATE TYPE public.request_category AS ENUM ('limpeza','reparos','tecnologia','design','aulas','transporte','eventos','beleza','outros');
CREATE TYPE public.application_status AS ENUM ('pending','review','rejected','hired','completed');
CREATE TYPE public.payment_status AS ENUM ('pending','escrow_held','released','refunded','cancelled');
CREATE TYPE public.job_status AS ENUM ('open','closed');
CREATE TYPE public.application_target AS ENUM ('request','job');

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  display_name text,
  email text,
  phone text,
  document_id text,
  document_type text,
  birth_date date,
  avatar_url text,
  bio text,
  city text,
  neighborhood text,
  state text,
  postal_code text,
  address_line text,
  latitude double precision,
  longitude double precision,
  company_name text,
  company_cnpj text,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  identity_verified boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  interests text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =========== USER ROLES ===========
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Roles viewable by everyone"
  ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Users manage own roles"
  ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own roles"
  ON public.user_roles FOR DELETE USING (auth.uid() = user_id);

-- =========== HELP REQUESTS ===========
CREATE TABLE public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category public.request_category NOT NULL,
  budget numeric(10,2) NOT NULL DEFAULT 0,
  city text NOT NULL,
  neighborhood text,
  state text,
  scheduled_at timestamptz,
  image_urls text[] NOT NULL DEFAULT '{}',
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'open',
  proposals_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests viewable by everyone" ON public.help_requests FOR SELECT USING (true);
CREATE POLICY "Authors create requests" ON public.help_requests FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own requests" ON public.help_requests FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors delete own requests" ON public.help_requests FOR DELETE USING (auth.uid() = author_id);

-- =========== HELP OFFERS ===========
CREATE TABLE public.help_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  description text NOT NULL,
  category public.request_category NOT NULL,
  pricing_type text NOT NULL DEFAULT 'hour',
  pricing_value numeric(10,2) NOT NULL DEFAULT 0,
  city text NOT NULL,
  coverage text,
  latitude double precision,
  longitude double precision,
  portfolio_urls text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.help_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offers viewable by everyone" ON public.help_offers FOR SELECT USING (true);
CREATE POLICY "Freelancers create own offers" ON public.help_offers FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
CREATE POLICY "Freelancers update own offers" ON public.help_offers FOR UPDATE USING (auth.uid() = freelancer_id);
CREATE POLICY "Freelancers delete own offers" ON public.help_offers FOR DELETE USING (auth.uid() = freelancer_id);

-- =========== COMPANY JOBS ===========
CREATE TABLE public.company_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category public.request_category NOT NULL,
  salary text,
  city text NOT NULL,
  modality text NOT NULL DEFAULT 'presencial',
  status public.job_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.company_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs viewable by everyone" ON public.company_jobs FOR SELECT USING (true);
CREATE POLICY "Companies create own jobs" ON public.company_jobs FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Companies update own jobs" ON public.company_jobs FOR UPDATE USING (auth.uid() = company_id);
CREATE POLICY "Companies delete own jobs" ON public.company_jobs FOR DELETE USING (auth.uid() = company_id);

-- =========== APPLICATIONS ===========
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.application_target NOT NULL,
  target_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  message text,
  proposed_price numeric(10,2),
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, target_type, target_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidate or owner can view application"
  ON public.applications FOR SELECT
  USING (auth.uid() = candidate_id OR auth.uid() = owner_id);
CREATE POLICY "Candidates create applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "Owner updates application status"
  ON public.applications FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = candidate_id);

-- =========== CHAT ===========
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_a, participant_b, topic)
);
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view threads"
  ON public.chat_threads FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "Participants create threads"
  ON public.chat_threads FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "Participants update threads"
  ON public.chat_threads FOR UPDATE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Thread participants view messages"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_threads t
                  WHERE t.id = thread_id
                    AND (auth.uid() = t.participant_a OR auth.uid() = t.participant_b)));
CREATE POLICY "Thread participants send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = from_user_id
              AND EXISTS (SELECT 1 FROM public.chat_threads t
                          WHERE t.id = thread_id
                            AND (auth.uid() = t.participant_a OR auth.uid() = t.participant_b)));

-- =========== NOTIFICATIONS ===========
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========== REVIEWS ===========
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, application_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Trigger to update profile rating
CREATE OR REPLACE FUNCTION public.refresh_profile_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET rating_avg = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE reviewed_user_id = NEW.reviewed_user_id), 0),
      reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE reviewed_user_id = NEW.reviewed_user_id)
  WHERE user_id = NEW.reviewed_user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_refresh_rating AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_profile_rating();

-- =========== PAYMENTS (ESCROW) ===========
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  payer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  fee_cents integer NOT NULL DEFAULT 0,
  net_cents integer NOT NULL DEFAULT 0,
  status public.payment_status NOT NULL DEFAULT 'pending',
  asaas_payment_id text,
  asaas_invoice_url text,
  asaas_pix_qr text,
  asaas_pix_copy_paste text,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payer or payee can view"
  ON public.payments FOR SELECT
  USING (auth.uid() = payer_id OR auth.uid() = payee_id);
CREATE POLICY "Payer creates payment"
  ON public.payments FOR INSERT WITH CHECK (auth.uid() = payer_id);
CREATE POLICY "Payer or payee updates"
  ON public.payments FOR UPDATE USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- =========== UPDATED_AT TRIGGER ===========
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_uat BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_requests_uat BEFORE UPDATE ON public.help_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_offers_uat BEFORE UPDATE ON public.help_offers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_apps_uat BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payments_uat BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========== AUTO PROFILE ON SIGNUP ===========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== STORAGE BUCKETS ===========
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars','avatars', true),
  ('request-images','request-images', true),
  ('offer-portfolios','offer-portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- public read for all 3
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read request images" ON storage.objects FOR SELECT USING (bucket_id = 'request-images');
CREATE POLICY "Public read portfolios" ON storage.objects FOR SELECT USING (bucket_id = 'offer-portfolios');

-- authenticated user uploads to their own folder (folder = user_id)
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own request images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'request-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own request images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'request-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own portfolio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'offer-portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own portfolio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'offer-portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========== REALTIME ===========
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
