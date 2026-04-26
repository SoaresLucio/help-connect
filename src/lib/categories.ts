import { RequestCategory } from "./types";
import {
  Sparkles, Wrench, Laptop, Palette, GraduationCap, Truck, PartyPopper, Scissors, Boxes,
} from "lucide-react";

export const CATEGORY_META: Record<RequestCategory, { label: string; icon: any; tone: string }> = {
  limpeza:    { label: "Limpeza",    icon: Sparkles,     tone: "bg-info/10 text-info" },
  reparos:    { label: "Reparos",    icon: Wrench,       tone: "bg-accent/15 text-accent" },
  tecnologia: { label: "Tecnologia", icon: Laptop,       tone: "bg-primary/10 text-primary" },
  design:     { label: "Design",     icon: Palette,      tone: "bg-fuchsia-500/10 text-fuchsia-600" },
  aulas:      { label: "Aulas",      icon: GraduationCap,tone: "bg-emerald-500/10 text-emerald-600" },
  transporte: { label: "Transporte", icon: Truck,        tone: "bg-sky-500/10 text-sky-600" },
  eventos:    { label: "Eventos",    icon: PartyPopper,  tone: "bg-rose-500/10 text-rose-600" },
  beleza:     { label: "Beleza",     icon: Scissors,     tone: "bg-pink-500/10 text-pink-600" },
  outros:     { label: "Outros",     icon: Boxes,        tone: "bg-muted text-muted-foreground" },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as RequestCategory[];

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const formatBRLCents = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
