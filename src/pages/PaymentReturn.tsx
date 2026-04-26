import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Payment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, ExternalLink } from "lucide-react";
import { formatBRLCents } from "@/lib/categories";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export default function PaymentReturn() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const refresh = async () => {
    if (!paymentId) return;
    const { data } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
    setPayment((data as any) ?? null);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [paymentId]);

  const release = async () => {
    if (!payment) return;
    setActing(true);
    try {
      const { error } = await supabase.functions.invoke("asaas-release-payment", { body: { payment_id: payment.id } });
      if (error) throw error;
      toast.success("Pagamento liberado!");
      await refresh();
    } catch (e: any) { toast.error(e.message ?? "Falha"); }
    finally { setActing(false); }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin" /></div>;
  if (!payment) return <div className="min-h-screen grid place-items-center text-muted-foreground">Pagamento não encontrado.</div>;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container h-16 flex items-center justify-between"><Logo /><Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">Voltar ao painel</Link></div>
      </header>
      <main className="container max-w-xl py-10">
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success mx-auto"><ShieldCheck className="h-7 w-7" /></div>
          <h1 className="font-display text-2xl font-bold mt-4">Pagamento em garantia</h1>
          <div className="text-3xl font-bold mt-2">{formatBRLCents(payment.amount_cents)}</div>
          <div className="text-xs text-muted-foreground mt-1">Status: <strong>{payment.status}</strong></div>

          {payment.asaas_invoice_url && (
            <a href={payment.asaas_invoice_url} target="_blank" rel="noreferrer" className="block mt-6">
              <Button variant="hero" className="w-full"><ExternalLink className="h-4 w-4" /> Pagar no ASAAS (PIX/Cartão/Boleto)</Button>
            </a>
          )}

          {payment.asaas_pix_copy_paste && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/40 text-xs break-all">
              <div className="font-semibold mb-1">PIX Copia e Cola:</div>
              <code>{payment.asaas_pix_copy_paste}</code>
            </div>
          )}

          <Button variant="outline" className="w-full mt-3" onClick={refresh}>Atualizar status</Button>

          {payment.status === "escrow_held" && (
            <Button variant="navy" className="w-full mt-3" onClick={release} disabled={acting}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Confirmar finalização e liberar pagamento
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
