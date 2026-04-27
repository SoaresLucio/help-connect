import { useAuth } from "@/hooks/useAuth";

export default function DashboardHome() {
  const { profile } = useAuth();
  const name = profile?.full_name ?? "Bem-vindo";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Olá, {name} 👋</h1>
        <p className="text-muted-foreground mt-1">Acesse o feed, mapa ou suas candidaturas pelo menu lateral.</p>
      </div>
      <div className="rounded-2xl border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Painel principal em construção.</p>
      </div>
    </div>
  );
}
