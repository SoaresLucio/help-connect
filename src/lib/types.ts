// Tipos da aplicação alinhados com o schema Supabase
export type UserRole = "freelancer" | "individual" | "company" | "admin";

export type RequestCategory =
  | "limpeza" | "reparos" | "tecnologia" | "design" | "aulas"
  | "transporte" | "eventos" | "beleza" | "outros";

export type ApplicationStatus = "pending" | "review" | "rejected" | "hired" | "completed";
export type PaymentStatus = "pending" | "escrow_held" | "released" | "refunded" | "cancelled";
export type ApplicationTarget = "request" | "job";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  document_id: string | null;
  document_type: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  neighborhood: string | null;
  state: string | null;
  postal_code: string | null;
  address_line: string | null;
  latitude: number | null;
  longitude: number | null;
  company_name: string | null;
  company_cnpj: string | null;
  rating_avg: number;
  reviews_count: number;
  identity_verified: boolean;
  onboarding_completed: boolean;
  interests: string[];
  created_at: string;
  updated_at: string;
}

export interface HelpRequest {
  id: string;
  author_id: string;
  title: string;
  description: string;
  category: RequestCategory;
  budget: number;
  city: string;
  neighborhood: string | null;
  state: string | null;
  scheduled_at: string | null;
  image_urls: string[];
  latitude: number | null;
  longitude: number | null;
  status: string;
  proposals_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  distance_km?: number;
}

export interface HelpOffer {
  id: string;
  freelancer_id: string;
  service_name: string;
  description: string;
  category: RequestCategory;
  pricing_type: "hour" | "fixed";
  pricing_value: number;
  city: string;
  coverage: string | null;
  latitude: number | null;
  longitude: number | null;
  portfolio_urls: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  freelancer?: Profile;
  distance_km?: number;
}

export interface CompanyJob {
  id: string;
  company_id: string;
  title: string;
  description: string;
  category: RequestCategory;
  salary: string | null;
  city: string;
  modality: "presencial" | "hibrido" | "remoto";
  status: "open" | "closed";
  created_at: string;
  company?: Profile;
}

export interface Application {
  id: string;
  candidate_id: string;
  target_type: ApplicationTarget;
  target_id: string;
  owner_id: string;
  message: string | null;
  proposed_price: number | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  candidate?: Profile;
}

export interface ChatThread {
  id: string;
  participant_a: string;
  participant_b: string;
  topic: string | null;
  last_message_at: string;
  created_at: string;
  other?: Profile;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  from_user_id: string;
  text: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  application_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
}

export interface Payment {
  id: string;
  application_id: string | null;
  payer_id: string;
  payee_id: string;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  status: PaymentStatus;
  asaas_payment_id: string | null;
  asaas_invoice_url: string | null;
  asaas_pix_qr: string | null;
  asaas_pix_copy_paste: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}
