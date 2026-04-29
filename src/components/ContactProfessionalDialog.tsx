import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HelpOffer } from "@/lib/types";
import { formatBRL } from "@/lib/categories";
import { ShieldCheck, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { pushNotification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { checkExternalContact } from "@/lib/contentFilter";

const FEE_PERCENT = 10;

export function ContactProfessionalDialog({ offer, onClose }: { offer: HelpOffer | null; onClose: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [step, setStep] = useState<"contact" | "escrow">("contact");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (offer) { setAmount(offer.pricing_value); setStep("contact"); setMessage(""); }
  }, [offer]);

  if (!offer) return null;

  const fee = Math.round((amount * FEE_PERCENT)) / 100 * 100; // 10% sobre o valor (em reais)
  const feeAmount = +(amount * FEE_PERCENT / 100).toFixed(2);
  const freelancerNet = +(amount - feeAmount).toFixed(2);

  const sendContact = async () => {
    if (!user || !profile) { toast.error("Faça login"); return; }
    if (message.trim().length < 5) { toast.error("Escreva uma mensagem mais detalhada"); return; }
    setLoading(true);
    try {
      // cria/recupera thread
      const a = user.id < offer.freelancer_id ? user.id : offer.freelancer_id;
      const b = user.id < offer.freelancer_id ? offer.freelancer_id : user.id;
      const topic = `Sobre: ${offer.service_name}`;
      let { data: thread } = await supabase.from("chat_threads")
        .select("*").eq("participant_a", a).eq("participant_b", b).eq("topic", topic).maybeSingle();
      if (!thread) {
        const { data: created, error } = await supabase.from("chat_threads")
          .insert({ participant_a: a, participant_b: b, topic }).select().single();
        if (error) throw error;
        thread = created;
      }
      await supabase.from("chat_messages").insert({
        thread_id: thread.id, from_user_id: user.id, text: message,
      });
      // notifica freelancer
      await pushNotification(offer.freelancer_id, "Nova mensagem de cliente",
        `${profile.full_name} entrou em contato sobre "${offer.service_name}"`,
        "message", "/app/mensagens");
      toast.success("Mensagem enviada!");
      setStep("escrow");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao enviar mensagem");
    } finally { setLoading(false); }
  };

  const startEscrow = async () => {
    if (!user) return;
    if (amount <= 0) { toast.error("Informe o valor combinado"); return; }
    setLoading(true);
    try {
      // cria application 'hired' opcional + payment
      const { data: app, error: appErr } = await supabase.from("applications").insert({
        candidate_id: offer.freelancer_id,
        target_type: "request",
        target_id: offer.id, // referenciamos a oferta como target
        owner_id: user.id,
        message: `Contratação direta: ${offer.service_name}`,
        proposed_price: amount,
        status: "hired",
      }).select().single();
      if (appErr) throw appErr;

      const { data, error } = await supabase.functions.invoke("asaas-create-payment", {
        body: {
          application_id: app.id,
          payee_id: offer.freelancer_id,
          amount_cents: Math.round(amount * 100),
          description: `HelpAqui · ${offer.service_name}`,
        },
      });
      if (error) throw error;
      onClose();
      navigate(`/pagamento/${data.payment_id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao iniciar pagamento");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={!!offer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {step === "contact" ? `Contratar ${offer.freelancer?.full_name || "profissional"}` : "Pagamento em garantia"}
          </DialogTitle>
        </DialogHeader>

        {step === "contact" ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="text-xs text-muted-foreground">Serviço</div>
              <div className="font-semibold">{offer.service_name}</div>
              <div className="text-xs mt-1 text-muted-foreground">Preço base: {formatBRL(offer.pricing_value)}{offer.pricing_type === "hour" ? "/h" : ""}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mensagem inicial</Label>
              <Textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Olá! Preciso do seu serviço para..." />
            </div>
            <Button variant="hero" className="w-full" onClick={sendContact} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Enviar e ir ao pagamento
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-success/30 bg-success/5 p-3 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Seu dinheiro fica seguro com a HelpAqui.</p>
                <p className="text-muted-foreground mt-1">Liberamos para o profissional somente após você confirmar a finalização do serviço.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor combinado (R$)</Label>
              <Input type="number" min={0} value={amount} onChange={e => setAmount(+e.target.value)} />
            </div>
            <div className="rounded-lg bg-secondary/40 p-3 text-xs space-y-1">
              <Row label="Valor combinado" value={formatBRL(amount)} />
              <Row label={`Taxa HelpAqui (${FEE_PERCENT}%)`} value={`- ${formatBRL(feeAmount)}`} muted />
              <div className="border-t my-1" />
              <Row label="Profissional recebe" value={formatBRL(freelancerNet)} bold />
              <Row label="Você paga" value={formatBRL(amount)} bold />
            </div>
            <Button variant="hero" className="w-full" onClick={startEscrow} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Pagar com segurança
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-foreground" : muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
