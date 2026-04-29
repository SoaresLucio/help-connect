/**
 * Contract Lifecycle State Machine
 *
 * Define as 6 etapas do contrato HelpAqui e as transições válidas.
 * Esta máquina é a fonte da verdade para qualquer botão de ação relacionado
 * a contratação, escrow e finalização.
 *
 * Etapas:
 *   1. proposal   → Proposta enviada / em negociação
 *   2. escrow     → Cliente efetuou o pagamento em garantia (custódia)
 *   3. execution  → Freelancer iniciou a execução do serviço
 *   4. delivery   → Freelancer marcou como entregue, aguardando confirmação
 *   5. release    → Cliente confirmou e o valor foi liberado
 *   6. review     → Avaliação mútua (cliente ↔ freelancer) obrigatória
 *
 * O estado é derivado de duas fontes do banco:
 *   - applications.status   (pending | review | hired | rejected | completed)
 *   - payments.status       (pending | escrow_held | released | refunded | cancelled)
 *   - reviews (existência)  para fechar a etapa 6
 */

import type { Application, ApplicationStatus, Payment, PaymentStatus } from "@/lib/types";

// ───────────────────────────────────────────────────────── Types

export type ContractStage =
  | "proposal"
  | "escrow"
  | "execution"
  | "delivery"
  | "release"
  | "review";

export const STAGES: ContractStage[] = [
  "proposal",
  "escrow",
  "execution",
  "delivery",
  "release",
  "review",
];

export interface StageMeta {
  index: number;
  label: string;
  description: string;
  /** Tailwind tone for badges. */
  tone: string;
}

export const STAGE_META: Record<ContractStage, StageMeta> = {
  proposal:  { index: 1, label: "Proposta",  description: "Negociação inicial entre as partes.",          tone: "bg-info/10 text-info" },
  escrow:    { index: 2, label: "Garantia",  description: "Pagamento retido com segurança pela HelpAqui.", tone: "bg-warning/10 text-warning" },
  execution: { index: 3, label: "Execução",  description: "Profissional autorizado a iniciar o serviço.",  tone: "bg-primary/10 text-primary" },
  delivery:  { index: 4, label: "Entrega",   description: "Profissional marcou como concluído.",            tone: "bg-accent/10 text-accent-foreground" },
  release:   { index: 5, label: "Liberação", description: "Cliente confirmou e valor foi liberado.",        tone: "bg-success/10 text-success" },
  review:    { index: 6, label: "Avaliação", description: "Avaliação mútua obrigatória.",                   tone: "bg-secondary text-foreground" },
};

export interface ContractContext {
  application: Pick<Application, "id" | "status" | "owner_id" | "candidate_id">;
  payment?: Pick<Payment, "id" | "status"> | null;
  /** Algum review já enviado pelo viewer atual? */
  hasReviewedByViewer?: boolean;
  /** Ambas as partes já avaliaram? */
  bothReviewed?: boolean;
}

export interface ActionPermission {
  allowed: boolean;
  reason?: string;
}

// ───────────────────────────────────────────────────────── Derivation

/**
 * Deriva a etapa atual do contrato a partir do estado persistido.
 * Regra: nunca avança para `execution` sem o pagamento estar em `escrow_held`.
 */
export function deriveStage(ctx: ContractContext): ContractStage {
  const { application, payment, bothReviewed } = ctx;
  const appStatus: ApplicationStatus = application.status;
  const payStatus: PaymentStatus | undefined = payment?.status;

  if (appStatus === "completed") {
    return bothReviewed ? "review" : "release";
  }
  if (appStatus === "hired") {
    if (!payStatus || payStatus === "pending") return "escrow";
    if (payStatus === "escrow_held") return "execution";
    if (payStatus === "released") return "release";
    return "escrow";
  }
  if (appStatus === "rejected") return "proposal";
  return "proposal";
}

// ───────────────────────────────────────────────────────── Transitions

/**
 * Transições válidas. Uma transição que não esteja aqui é proibida.
 */
const TRANSITIONS: Record<ContractStage, ContractStage[]> = {
  proposal:  ["escrow"],
  escrow:    ["execution"],            // só após webhook ASAAS confirmar pagamento
  execution: ["delivery"],
  delivery:  ["release", "execution"], // cliente pode reabrir se não concluído
  release:   ["review"],
  review:    [],
};

export function canTransition(from: ContractStage, to: ContractStage): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// ───────────────────────────────────────────────────────── Permissions

export type Role = "owner" | "candidate" | "other";

export function whoIs(viewerId: string, ctx: ContractContext): Role {
  if (viewerId === ctx.application.owner_id) return "owner";
  if (viewerId === ctx.application.candidate_id) return "candidate";
  return "other";
}

/**
 * O cliente (owner) pode pagar a garantia?
 * Só na etapa `escrow`. Bloqueia repagamento se já está em custódia.
 */
export function canPayEscrow(viewerId: string, ctx: ContractContext): ActionPermission {
  const stage = deriveStage(ctx);
  const role = whoIs(viewerId, ctx);
  if (role !== "owner") return { allowed: false, reason: "Apenas o contratante pode pagar a garantia." };
  if (stage !== "escrow") return { allowed: false, reason: "Pagamento já efetuado ou contrato em outra etapa." };
  return { allowed: true };
}

/**
 * O freelancer (candidate) pode iniciar execução?
 * Regra de ouro: apenas se o pagamento estiver em `escrow_held`.
 */
export function canStartExecution(viewerId: string, ctx: ContractContext): ActionPermission {
  const role = whoIs(viewerId, ctx);
  if (role !== "candidate") return { allowed: false, reason: "Apenas o profissional contratado pode iniciar." };
  if (ctx.payment?.status !== "escrow_held") {
    return { allowed: false, reason: "Aguarde a confirmação do pagamento em garantia para iniciar." };
  }
  return { allowed: true };
}

/**
 * O freelancer pode marcar entrega?
 */
export function canMarkDelivered(viewerId: string, ctx: ContractContext): ActionPermission {
  const stage = deriveStage(ctx);
  const role = whoIs(viewerId, ctx);
  if (role !== "candidate") return { allowed: false, reason: "Apenas o profissional pode marcar como entregue." };
  if (stage !== "execution") return { allowed: false, reason: "Contrato não está em execução." };
  return { allowed: true };
}

/**
 * O cliente pode liberar o pagamento?
 * Requer pagamento em escrow_held.
 */
export function canReleasePayment(viewerId: string, ctx: ContractContext): ActionPermission {
  const role = whoIs(viewerId, ctx);
  if (role !== "owner") return { allowed: false, reason: "Apenas o contratante pode liberar o pagamento." };
  if (ctx.payment?.status !== "escrow_held") {
    return { allowed: false, reason: "Pagamento ainda não está em garantia." };
  }
  return { allowed: true };
}

/**
 * Avaliação mútua: ambas as partes podem (e devem) avaliar após release.
 */
export function canReview(viewerId: string, ctx: ContractContext): ActionPermission {
  const stage = deriveStage(ctx);
  const role = whoIs(viewerId, ctx);
  if (role === "other") return { allowed: false, reason: "Você não participa deste contrato." };
  if (stage !== "release" && stage !== "review") {
    return { allowed: false, reason: "Avaliação disponível após a liberação do pagamento." };
  }
  if (ctx.hasReviewedByViewer) return { allowed: false, reason: "Você já enviou sua avaliação." };
  return { allowed: true };
}

// ───────────────────────────────────────────────────────── Helpers

export function stageProgress(stage: ContractStage): number {
  return Math.round((STAGE_META[stage].index / STAGES.length) * 100);
}

export function nextStage(stage: ContractStage): ContractStage | null {
  const next = TRANSITIONS[stage]?.[0];
  return next ?? null;
}
