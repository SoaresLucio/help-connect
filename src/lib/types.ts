export type UserRole = "freelancer" | "individual" | "company";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  companyName?: string;
  city?: string;
}

export type RequestCategory =
  | "limpeza"
  | "reparos"
  | "tecnologia"
  | "design"
  | "aulas"
  | "transporte"
  | "eventos"
  | "beleza"
  | "outros";

export interface HelpRequest {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorType: "individual" | "company";
  title: string;
  description: string;
  category: RequestCategory;
  budget: number;
  city: string;
  neighborhood: string;
  scheduledAt: string;
  imageUrl?: string;
  createdAt: string;
  proposalsCount: number;
}

export interface HelpOffer {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  rating: number;
  reviews: number;
  serviceName: string;
  description: string;
  category: RequestCategory;
  pricing: { type: "hour" | "fixed"; value: number };
  coverage: string;
  city: string;
  portfolio?: string[];
}

export type JobStatus = "open" | "closed";
export type CandidateStatus = "pending" | "review" | "rejected" | "hired";

export interface CompanyJob {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  category: RequestCategory;
  salary: string;
  city: string;
  modality: "presencial" | "hibrido" | "remoto";
  status: JobStatus;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar?: string;
  candidateHeadline: string;
  status: CandidateStatus;
  appliedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  fromId: string;
  text: string;
  at: string;
}

export interface ChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  topic: string;
  lastMessageAt: string;
}
