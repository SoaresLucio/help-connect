import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { pushNotification } from "@/hooks/useNotifications";

interface Props {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  reviewedUserId: string;
  reviewedName?: string;
  onSubmitted?: () => void;
}

/**
 * Avaliação mútua obrigatória ao final do contrato.
 * Bloqueia envios duplicados pelo mesmo reviewer no mesmo application.
 */
export function ReviewDialog({ open, onClose, applicationId, reviewedUserId, reviewedName, onSubmitted }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [already, setAlready] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setRating(5); setComment(""); setAlready(false);
    supabase.from("reviews").select("id")
      .eq("application_id", applicationId)
      .eq("reviewer_id", user.id)
      .maybeSingle()
      .then(({ data }) => setAlready(!!data));
  }, [open, user, applicationId]);

  const submit = async () => {
    if (!user) return;
    if (rating < 1) { toast.error("Escolha uma nota"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        reviewer_id: user.id,
        reviewed_user_id: reviewedUserId,
        application_id: applicationId,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      await pushNotification(reviewedUserId, "Você recebeu uma avaliação",
        `${rating} estrela${rating > 1 ? "s" : ""}.`, "review", `/u/${reviewedUserId}`);
      toast.success("Avaliação enviada!");
      onSubmitted?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao enviar avaliação");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Avaliar {reviewedName || "parceiro"}</DialogTitle>
        </DialogHeader>

        {already ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Você já enviou sua avaliação para este contrato. Obrigado!
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)} type="button"
                  className="transition-transform hover:scale-110">
                  <Star className={`h-8 w-8 ${n <= rating ? "fill-accent text-accent" : "text-muted"}`} />
                </button>
              ))}
            </div>
            <Textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Conte como foi a experiência (opcional)" />
            <Button variant="hero" className="w-full" onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              Enviar avaliação
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
