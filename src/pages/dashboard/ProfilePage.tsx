import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { profile, user } = useAuth();
  if (!user) return null;
  const name = profile?.full_name ?? user.email ?? "Usuário";
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("");

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Perfil</h1>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="bg-gradient-hero p-8 text-primary-foreground flex items-center gap-5">
          <Avatar className="h-20 w-20 ring-4 ring-accent/30">
            <AvatarFallback className="bg-accent text-accent-foreground font-bold text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-2xl font-bold">{name}</h2>
            <p className="text-primary-foreground/80 text-sm">{user.email}</p>
          </div>
        </div>
        <div className="p-7 text-sm text-muted-foreground">
          Edição completa de perfil em breve.
        </div>
      </div>
    </div>
  );
}
