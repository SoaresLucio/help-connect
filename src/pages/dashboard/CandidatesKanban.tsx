import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Application, ApplicationStatus, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Check, X, Star, User } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { pushNotification } from "@/hooks/useNotifications";
import { formatBRL } from "@/lib/categories";

const COLUMNS: { key: ApplicationStatus; label: string; tone: string }[] = [
  { key: "pending",  label: "Recebidos",  tone: "bg-info/10 text-info" },
  { key: "review",   label: "Em análise", tone: "bg-warning/10 text-warning" },
  { key: "hired",    label: "Contratados",tone: "bg-success/10 text-success" },
  { key: "rejected", label: "Rejeitados", tone: "bg-muted text-muted-foreground" },
  { key: "completed",label: "Concluídos", tone: "bg-primary/10 text-primary" },
];

export default function CandidatesKanban() {
  const { user } = useAuth();
  const [apps, setApps] = useState<(Application & { candidate?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("applications").select("*")
      .eq("owner_id", user.id).order("created_at", { ascending: false });
    const rows = (data as any[]) ?? [];
    const ids = Array.from(new Set(rows.map(r => r.candidate_id)));
    const { data: candidates } = ids.length
      ? await supabase.from("profiles_public").select("*").in("user_id", ids)
      : { data: [] as any[] };
    const byId = new Map((candidates ?? []).map((c: any) => [c.user_id, c]));
    setApps(rows.map(r => ({ ...r, candidate: byId.get(r.candidate_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const move = async (app: Application, status: ApplicationStatus) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", app.id);
    if (error) return toast.error(error.message);
    setApps(arr => arr.map(a => a.id === app.id ? { ...a, status } : a));
    const labels: Record<ApplicationStatus, string> = {
      pending: "Recebida", review: "Em análise", hired: "Contratado", rejected: "Recusada", completed: "Concluída",
    };
    await pushNotification(app.candidate_id, "Atualização da sua candidatura", `Status atualizado para: ${labels[status]}`, "application", "/app/minhas-candidaturas");
    toast.success("Candidato movido");
  };

  const hireAndPay = async (app: Application) => {
    if (!user) return;
    if (!app.proposed_price || app.proposed_price <= 0) {
      toast.error("Esta proposta não tem valor combinado. Negocie pelo chat antes de contratar.");
      return;
    }
    try {
      await supabase.from("applications").update({ status: "hired" }).eq("id", app.id);
      const { data, error } = await supabase.functions.invoke("asaas-create-payment", {
        body: {
          application_id: app.id,
          payee_id: app.candidate_id,
          amount_cents: Math.round(Number(app.proposed_price) * 100),
          description: `HelpAqui · Contratação`,
        },
      });
      if (error) throw error;
      await pushNotification(app.candidate_id, "Você foi contratado!",
        "O cliente está efetuando o pagamento em garantia.", "application", "/app/minhas-candidaturas");
      window.location.href = `/pagamento/${data.payment_id}`;
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao iniciar contratação");
    }
  };


  const startChat = async (app: Application & { candidate?: Profile }) => {
    if (!user) return;
    const a = user.id < app.candidate_id ? user.id : app.candidate_id;
    const b = user.id < app.candidate_id ? app.candidate_id : user.id;
    let { data: thread } = await supabase.from("chat_threads").select("*")
      .eq("participant_a", a).eq("participant_b", b).maybeSingle();
    if (!thread) {
      const { data } = await supabase.from("chat_threads").insert({
        participant_a: a, participant_b: b, topic: "Conversa sobre candidatura",
      }).select().single();
      thread = data;
    }
    window.location.href = "/app/mensagens";
  };

  const grouped = useMemo(() => {
    const g: Record<ApplicationStatus, typeof apps> = { pending: [], review: [], hired: [], rejected: [], completed: [] };
    apps.forEach(a => g[a.status]?.push(a));
    return g;
  }, [apps]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Candidatos</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas candidaturas em colunas tipo Kanban.</p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhuma candidatura recebida ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="rounded-2xl bg-secondary/40 p-3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${col.tone}`}>{col.label}</span>
                <span className="text-xs text-muted-foreground">{grouped[col.key].length}</span>
              </div>
              <div className="space-y-2">
                {grouped[col.key].map((app, i) => {
                  const c = app.candidate;
                  const name = c?.display_name || c?.full_name || "Candidato";
                  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <motion.div key={app.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="rounded-xl border bg-card p-3 shadow-sm">
                      <Link to={`/u/${app.candidate_id}`} className="flex items-start gap-2 hover:bg-secondary/40 rounded-md p-1 -m-1 transition-colors">
                        <Avatar className="h-8 w-8">
                          {c?.avatar_url && <AvatarImage src={c.avatar_url} />}
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{name}</div>
                          {c?.rating_avg && c.rating_avg > 0 ? (
                            <div className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" /> {c.rating_avg.toFixed(1)} · {c.reviews_count}</div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground">Ver perfil →</div>
                          )}
                        </div>
                      </Link>
                      {app.message && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{app.message}</p>}
                      {app.proposed_price != null && app.proposed_price > 0 && (
                        <div className="mt-2 text-sm font-bold text-primary">{formatBRL(app.proposed_price)}</div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {col.key !== "review" && col.key !== "rejected" && col.key !== "completed" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => move(app, "review")}>Análise</Button>
                        )}
                        {col.key !== "hired" && col.key !== "completed" && (
                          <Button size="sm" variant="hero" className="h-7 text-xs" onClick={() => move(app, "hired")}><Check className="h-3 w-3" />Contratar</Button>
                        )}
                        {col.key !== "rejected" && col.key !== "completed" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => move(app, "rejected")}><X className="h-3 w-3" />Recusar</Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => startChat(app)}>
                          <MessageSquare className="h-3 w-3" />Chat
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
