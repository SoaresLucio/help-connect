import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Application, Profile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando", review: "Em análise", hired: "Contratado", rejected: "Recusado", completed: "Concluído",
};
const STATUS_TONE: Record<string, string> = {
  pending: "bg-info/10 text-info",
  review: "bg-warning/10 text-warning",
  hired: "bg-success/10 text-success",
  rejected: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<(Application & { owner?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("applications").select("*").eq("candidate_id", user.id)
        .order("created_at", { ascending: false });
      const rows = (data as any[]) ?? [];
      const ids = Array.from(new Set(rows.map(r => r.owner_id)));
      const { data: owners } = ids.length
        ? await supabase.from("profiles_public").select("*").in("user_id", ids)
        : { data: [] as any[] };
      const byId = new Map((owners ?? []).map((p: any) => [p.user_id, p]));
      setApps(rows.map(r => ({ ...r, owner: byId.get(r.owner_id) })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Minhas candidaturas</h1>
      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Você ainda não enviou nenhuma proposta.
        </div>
      ) : apps.map(a => {
        const name = a.owner?.display_name || a.owner?.full_name || "Cliente";
        const initials = name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();
        return (
          <div key={a.id} className="rounded-xl border bg-card p-4 flex items-center justify-between gap-3">
            <Link to={`/u/${a.owner_id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10">
                {a.owner?.avatar_url && <AvatarImage src={a.owner.avatar_url} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{name}</div>
                <div className="text-xs text-muted-foreground truncate">{a.message?.slice(0, 70) ?? "Proposta"}</div>
                <div className="text-[10px] text-muted-foreground inline-flex items-center gap-2 mt-0.5">
                  <span>{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                  {a.owner && a.owner.rating_avg > 0 && (
                    <span className="inline-flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-accent text-accent" /> {a.owner.rating_avg.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </Link>
            <span className={`text-xs font-semibold rounded-full px-3 py-1 ${STATUS_TONE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
          </div>
        );
      })}
    </div>
  );
}
