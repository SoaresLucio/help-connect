import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Briefcase, User as UserIcon } from "lucide-react";
import { UserRole } from "@/lib/types";
import { toast } from "sonner";

const ROLES: { v: UserRole; l: string; i: any }[] = [
  { v: "freelancer", l: "Freelancer", i: Briefcase },
  { v: "individual", l: "Pessoa Física", i: UserIcon },
  { v: "company",    l: "Empresa", i: Building2 },
];

export default function ProfilePage() {
  const { user, switchRole } = useAuth();
  if (!user) return null;
  const initials = user.name.split(" ").map(s => s[0]).slice(0, 2).join("");

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Perfil</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-card overflow-hidden"
      >
        <div className="bg-gradient-hero p-8 text-primary-foreground flex items-center gap-5">
          <Avatar className="h-20 w-20 ring-4 ring-accent/30">
            <AvatarFallback className="bg-accent text-accent-foreground font-bold text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-2xl font-bold">{user.name}</h2>
            <p className="text-primary-foreground/80 text-sm">{user.email}</p>
            <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent text-accent-foreground px-2.5 py-1">
              {ROLES.find(r => r.v === user.role)?.l}
            </span>
          </div>
        </div>

        <form className="p-7 grid sm:grid-cols-2 gap-5" onSubmit={e => { e.preventDefault(); toast.success("Perfil atualizado!"); }}>
          <Field label="Nome completo">
            <Input defaultValue={user.name} />
          </Field>
          <Field label="E-mail">
            <Input defaultValue={user.email} type="email" />
          </Field>
          <Field label="Cidade">
            <Input defaultValue={user.city} />
          </Field>
          <Field label="Telefone">
            <Input placeholder="(11) 99999-9999" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Bio">
              <Textarea rows={3} placeholder="Conte um pouco sobre você ou sua empresa..." />
            </Field>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="hero">Salvar alterações</Button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border bg-card p-6"
      >
        <h3 className="font-display text-lg font-semibold">Trocar tipo de conta (demo)</h3>
        <p className="text-sm text-muted-foreground mt-1">Para fins de demonstração, alterne entre os perfis e veja como o painel se adapta.</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {ROLES.map(r => {
            const Icon = r.i;
            const active = user.role === r.v;
            return (
              <button
                key={r.v}
                onClick={() => { switchRole(r.v); toast.success(`Agora você é: ${r.l}`); }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active ? "border-accent bg-accent-soft shadow-sm" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${active ? "text-accent" : "text-muted-foreground"}`} />
                <div className="font-semibold text-sm">{r.l}</div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
