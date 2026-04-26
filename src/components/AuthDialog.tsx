import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/types";
import { Briefcase, Building2, User as UserIcon, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultRole?: UserRole;
  defaultMode?: "signin" | "signup";
}

const ROLES: { value: UserRole; label: string; desc: string; icon: any }[] = [
  { value: "freelancer", label: "Freelancer", desc: "Quero oferecer meus serviços", icon: Briefcase },
  { value: "individual", label: "Pessoa Física", desc: "Preciso contratar um help", icon: UserIcon },
  { value: "company",    label: "Empresa", desc: "Contrato e publico vagas", icon: Building2 },
];

export function AuthDialog({ open, onOpenChange, defaultRole = "individual", defaultMode = "signin" }: Props) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [mode, setMode] = useState(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha email e senha"); return; }
    if (mode === "signup" && !name.trim()) { toast.error("Informe seu nome"); return; }
    if (password.length < 6) { toast.error("Senha de pelo menos 6 caracteres"); return; }
    setLoading(true);
    try {
      const res = mode === "signup"
        ? await signUpWithEmail(email, password, name, role)
        : await signInWithEmail(email, password);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "signup" ? "Conta criada! Bem-vindo." : "Bem-vindo de volta!");
      onOpenChange(false);
      navigate("/app");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      localStorage.setItem("helpaqui.activeRole", role);
      await signInWithGoogle();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no login com Google");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-hero px-6 py-5 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {mode === "signin" ? "Entrar no HelpAqui" : "Criar conta no HelpAqui"}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Escolha seu perfil e continue em segundos.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => {
              const Icon = r.icon;
              const active = role === r.value;
              return (
                <button
                  key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`relative rounded-lg border p-3 text-left transition-all ${
                    active ? "border-accent bg-accent-soft shadow-sm" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1.5 ${active ? "text-accent" : "text-muted-foreground"}`} />
                  <div className="text-xs font-semibold leading-tight">{r.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{r.desc}</div>
                </button>
              );
            })}
          </div>

          <Tabs value={mode} onValueChange={v => setMode(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                <TabsContent value="signin" forceMount={mode === "signin" ? true : undefined} className="mt-4 space-y-3">
                  <form onSubmit={handleEmail} className="space-y-3">
                    <Field label="E-mail" icon={Mail}>
                      <Input type="email" placeholder="voce@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </Field>
                    <Field label="Senha" icon={Lock}>
                      <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </Field>
                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup" forceMount={mode === "signup" ? true : undefined} className="mt-4 space-y-3">
                  <form onSubmit={handleEmail} className="space-y-3">
                    <Field label={role === "company" ? "Razão social" : "Nome completo"} icon={UserIcon}>
                      <Input placeholder={role === "company" ? "Sua Empresa LTDA" : "Maria Silva"} value={name} onChange={e => setName(e.target.value)} />
                    </Field>
                    <Field label="E-mail" icon={Mail}>
                      <Input type="email" placeholder="voce@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </Field>
                    <Field label="Senha" icon={Lock}>
                      <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
                    </Field>
                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                      {loading ? "Criando..." : "Criar conta"}
                    </Button>
                  </form>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
          </div>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={loading}>
            <GoogleIcon /> Continuar com Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </Label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 11v3.2h4.5c-.2 1.2-1.4 3.6-4.5 3.6-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5c1.6 0 2.6.6 3.2 1.2l2.2-2.1C16 5.6 14.2 4.8 12 4.8 7.6 4.8 4 8.4 4 12.8s3.6 8 8 8c4.6 0 7.6-3.2 7.6-7.8 0-.5-.1-.9-.1-1.3H12z"/>
    </svg>
  );
}
