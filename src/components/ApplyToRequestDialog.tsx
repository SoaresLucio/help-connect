import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HelpRequest } from "@/lib/types";
import { formatBRL } from "@/lib/categories";
import { Loader2, Send } from "lucide-react";
import { pushNotification } from "@/hooks/useNotifications";

export function ApplyToRequestDialog({ request, onClose }: { request: HelpRequest | null; onClose: () => void }) {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request) { setMessage(""); setPrice(request.budget); }
  }, [request]);

  if (!request) return null;

  const send = async () => {
    if (!user || !profile) return;
    if (message.trim().length < 5) { toast.error("Escreva uma proposta detalhada"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("applications").insert({
        candidate_id: user.id,
        target_type: "request",
        target_id: request.id,
        owner_id: request.author_id,
        message,
        proposed_price: price,
        status: "pending",
      });
      if (error) throw error;
      // contador
      await supabase.from("help_requests").update({
        proposals_count: (request.proposals_count ?? 0) + 1,
      }).eq("id", request.id);
      // notifica autor da solicitação
      await pushNotification(request.author_id,
        "Nova candidatura recebida",
        `${profile.full_name} se candidatou para "${request.title}"`,
        "application", "/app/candidatos");
      // notifica freelancer
      await pushNotification(user.id,
        "Candidatura enviada",
        `Você se candidatou para "${request.title}"`,
        "application", "/app/minhas-candidaturas");
      toast.success("Proposta enviada com sucesso!");
      onClose();
    } catch (e: any) {
      if (e.code === "23505") toast.error("Você já se candidatou a essa solicitação.");
      else toast.error(e.message ?? "Falha ao enviar proposta");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Enviar proposta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary/40 p-3">
            <div className="text-xs text-muted-foreground">Solicitação</div>
            <div className="font-semibold leading-tight">{request.title}</div>
            <div className="text-xs mt-1 text-muted-foreground">Orçamento sugerido: {formatBRL(request.budget)}</div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sua mensagem</Label>
            <Textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Olá! Posso resolver isso para você porque..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preço proposto (R$)</Label>
            <Input type="number" min={0} value={price} onChange={e => setPrice(+e.target.value)} />
          </div>
          <Button variant="hero" className="w-full" onClick={send} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar proposta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
