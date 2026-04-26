import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Application } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando", review: "Em análise", hired: "Contratado", rejected: "Recusado", completed: "Concluído",
};

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("applications").select("*").eq("candidate_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setApps((data as any) ?? []));
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Minhas candidaturas</h1>
      {apps.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Você ainda não enviou nenhuma proposta.
        </div>
      ) : apps.map(a => (
        <div key={a.id} className="rounded-xl border bg-card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{a.message?.slice(0, 60) ?? "Proposta"}</div>
            <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
          </div>
          <span className="text-xs font-semibold rounded-full bg-secondary px-3 py-1">{STATUS_LABEL[a.status]}</span>
        </div>
      ))}
    </div>
  );
}
