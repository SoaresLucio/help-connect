import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Application, Payment, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, ExternalLink, Star, PlayCircle, PackageCheck } from "lucide-react";
import { formatBRLCents } from "@/lib/categories";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ContractStatusBar } from "@/components/ContractStatusBar";
import { ReviewDialog } from "@/components/ReviewDialog";
import {
  ContractContext, canPayEscrow, canReleasePayment, canReview, canStartExecution,
  canMarkDelivered, deriveStage, whoIs,
} from "@/logic/contractStatus";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PaymentReturn() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { user } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [counterpart, setCounterpart] = useState<Profile | null>(null);
  const [reviewedByViewer, setReviewedByViewer] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const refresh = async () => {
    if (!paymentId || !user) return;
    const { data: p } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
    setPayment((p as any) ?? null);
    if (p?.application_id) {
      const { data: a } = await supabase.from("applications").select("*").eq("id", p.application_id).maybeSingle();
      setApplication((a as any) ?? null);
      const otherId = user.id === p.payer_id ? p.payee_id : p.payer_id;
      const { data: prof } = await supabase.from("profiles_public").select("*").eq("user_id", otherId).maybeSingle();
      setCounterpart((prof as any) ?? null);
      const { data: revs } = await supabase.from("reviews").select("id, reviewer_id")
        .eq("application_id", p.application_id);
      const list = (revs as any[]) ?? [];
      setReviewsCount(list.length);
      setReviewedByViewer(list.some(r => r.reviewer_id === user.id));
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [paymentId, user]);

  const ctx: ContractContext | null = useMemo(() => {
    if (!application || !payment) return null;
    return {
      application,
      payment,
      hasReviewedByViewer: reviewedByViewer,
      bothReviewed: reviewsCount >= 2,
    };
  }, [application, payment, reviewedByViewer, reviewsCount]);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin" /></div>;
  if (!payment) return <div className="min-h-screen grid place-items-center text-muted-foreground">Pagamento não encontrado.</div>;

  const stage = ctx ? deriveStage(ctx) : "escrow";
  const role = ctx && user ? whoIs(user.id, ctx) : "other";

  const release = async () => {
    if (!payment || !ctx || !user) return;
    const perm = canReleasePayment(user.id, ctx);
    if (!perm.allowed) { toast.error(perm.reason!); return; }
    setActing(true);
    try {
      const { error } = await supabase.functions.invoke("asaas-release-payment", { body: { payment_id: payment.id } });
      if (error) throw error;
      toast.success("Pagamento liberado! Avalie o profissional.");
      await refresh();
      setReviewOpen(true);
    } catch (e: any) { toast.error(e.message ?? "Falha"); }
    finally { setActing(false); }
  };

  const counterpartName = counterpart?.display_name || counterpart?.full_name || "parceiro";
  const counterpartId = user && payment ? (user.id === payment.payer_id ? payment.payee_id : payment.payer_id) : "";

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container h-16 flex items-center justify-between"><Logo /><Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">Voltar ao painel</Link></div>
      </header>
      <main className="container max-w-xl py-10 space-y-4">
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success mx-auto"><ShieldCheck className="h-7 w-7" /></div>
          <h1 className="font-display text-2xl font-bold mt-4 text-center">Contrato HelpAqui</h1>
          <div className="text-3xl font-bold mt-2 text-center">{formatBRLCents(payment.amount_cents)}</div>

          {counterpart && (
            <Link to={`/u/${counterpartId}`} className="mt-4 flex items-center gap-3 p-3 rounded-xl border hover:bg-secondary/40 transition-colors">
              <Avatar className="h-10 w-10">
                {counterpart.avatar_url && <AvatarImage src={counterpart.avatar_url} />}
                <AvatarFallback>{counterpartName.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{counterpartName}</div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {counterpart.rating_avg > 0 ? counterpart.rating_avg.toFixed(1) : "Novo"}
                  · {counterpart.reviews_count} avaliações
                </div>
              </div>
              <span className="text-xs text-primary">Ver perfil →</span>
            </Link>
          )}

          {ctx && <ContractStatusBar context={ctx} className="mt-6" />}
        </div>

        {/* Ações por etapa */}
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          {/* Etapa 2 — Pagar garantia */}
          {stage === "escrow" && role === "owner" && payment.asaas_invoice_url && (
            <a href={payment.asaas_invoice_url} target="_blank" rel="noreferrer" className="block">
              <Button variant="hero" className="w-full"><ExternalLink className="h-4 w-4" /> Pagar garantia (PIX/Cartão/Boleto)</Button>
            </a>
          )}
          {stage === "escrow" && payment.asaas_pix_copy_paste && role === "owner" && (
            <div className="p-3 rounded-lg bg-secondary/40 text-xs break-all">
              <div className="font-semibold mb-1">PIX Copia e Cola:</div>
              <code>{payment.asaas_pix_copy_paste}</code>
            </div>
          )}
          {stage === "escrow" && role === "candidate" && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aguardando o cliente efetuar o pagamento em garantia para você iniciar o serviço.
            </p>
          )}

          {/* Etapa 3 — Iniciar execução */}
          {stage === "execution" && role === "candidate" && ctx && (
            <Button variant="navy" className="w-full" disabled={!canStartExecution(user!.id, ctx).allowed}>
              <PlayCircle className="h-4 w-4" /> Pagamento confirmado · Inicie o serviço
            </Button>
          )}
          {stage === "execution" && role === "owner" && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Pagamento em garantia ✓ — o profissional já pode iniciar o serviço.
            </p>
          )}

          {/* Etapa 4/5 — Marcar entrega / liberar */}
          {(stage === "execution" || stage === "delivery") && role === "candidate" && ctx && canMarkDelivered(user!.id, ctx).allowed && (
            <Button variant="outline" className="w-full" disabled>
              <PackageCheck className="h-4 w-4" /> Marcar como entregue (aguardando confirmação do cliente)
            </Button>
          )}
          {stage === "execution" && role === "owner" && (
            <Button variant="hero" className="w-full" onClick={release} disabled={acting}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Confirmar finalização e liberar pagamento
            </Button>
          )}

          {/* Etapa 6 — Avaliação mútua */}
          {(stage === "release" || stage === "review") && ctx && user && canReview(user.id, ctx).allowed && (
            <Button variant="hero" className="w-full" onClick={() => setReviewOpen(true)}>
              <Star className="h-4 w-4" /> Avaliar {counterpartName}
            </Button>
          )}
          {(stage === "release" || stage === "review") && reviewedByViewer && (
            <p className="text-sm text-success text-center py-2">✓ Sua avaliação foi enviada. Obrigado!</p>
          )}

          <Button variant="ghost" size="sm" className="w-full" onClick={refresh}>Atualizar status</Button>
        </div>
      </main>

      {ctx && user && (
        <ReviewDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          applicationId={ctx.application.id}
          reviewedUserId={counterpartId}
          reviewedName={counterpartName}
          onSubmitted={refresh}
        />
      )}
    </div>
  );
}
