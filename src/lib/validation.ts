import { z } from "zod";

export const requestSchema = z.object({
  title: z.string().trim().min(5, "Título muito curto").max(120),
  description: z.string().trim().min(20, "Descreva com pelo menos 20 caracteres").max(2000),
  category: z.enum(["limpeza","reparos","tecnologia","design","aulas","transporte","eventos","beleza","outros"]),
  budget: z.coerce.number().min(0).max(1_000_000),
  city: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  scheduled_at: z.string().optional().or(z.literal("")),
});

export const offerSchema = z.object({
  service_name: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(2000),
  category: z.enum(["limpeza","reparos","tecnologia","design","aulas","transporte","eventos","beleza","outros"]),
  pricing_type: z.enum(["hour","fixed"]),
  pricing_value: z.coerce.number().min(0).max(1_000_000),
  city: z.string().trim().min(2).max(80),
  coverage: z.string().trim().max(120).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(3).max(120),
  phone: z.string().trim().min(8).max(20).optional().or(z.literal("")),
  document_id: z.string().trim().min(11).max(20).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(2).optional().or(z.literal("")),
  postal_code: z.string().trim().max(10).optional().or(z.literal("")),
  address_line: z.string().trim().max(200).optional().or(z.literal("")),
});

export type RequestInput = z.infer<typeof requestSchema>;
export type OfferInput = z.infer<typeof offerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
