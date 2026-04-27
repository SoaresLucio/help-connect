import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Compass, PlusSquare, Briefcase, Users, MessageSquare, UserCircle,
  LogOut, Bell, Search, Building2, User as UserIcon, BriefcaseBusiness, Menu, X, Inbox,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole } from "@/lib/types";
import { AuthDialog } from "@/components/AuthDialog";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { cn } from "@/lib/utils";

const ROLE_META: Record<UserRole, { label: string; icon: any; color: string }> = {
  freelancer: { label: "Freelancer",      icon: BriefcaseBusiness, color: "bg-accent text-accent-foreground" },
  individual: { label: "Pessoa Física",   icon: UserIcon,          color: "bg-info text-info-foreground" },
  company:    { label: "Empresa",         icon: Building2,         color: "bg-success text-success-foreground" },
  admin:      { label: "Admin",           icon: UserCircle,        color: "bg-primary text-primary-foreground" },
};

type NavItem = { to: string; label: string; icon: any; end?: boolean };
const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  individual: [
    { to: "/app",            label: "Visão geral", icon: LayoutDashboard, end: true },
    { to: "/app/feed",       label: "Profissionais", icon: Compass },
    { to: "/app/solicitar",  label: "Solicitar help", icon: PlusSquare },
    { to: "/app/mensagens",  label: "Mensagens", icon: MessageSquare },
    { to: "/app/perfil",     label: "Perfil", icon: UserCircle },
  ],
  freelancer: [
    { to: "/app",            label: "Visão geral", icon: LayoutDashboard, end: true },
    { to: "/app/feed",       label: "Demandas abertas", icon: Compass },
    { to: "/app/oferecer",   label: "Anunciar serviço", icon: PlusSquare },
    { to: "/app/minhas-candidaturas", label: "Minhas candidaturas", icon: Inbox },
    { to: "/app/vagas",      label: "Vagas formais", icon: Briefcase },
    { to: "/app/mensagens",  label: "Mensagens", icon: MessageSquare },
    { to: "/app/perfil",     label: "Perfil", icon: UserCircle },
  ],
  company: [
    { to: "/app",            label: "Visão geral", icon: LayoutDashboard, end: true },
    { to: "/app/feed",       label: "Buscar profissionais", icon: Compass },
    { to: "/app/solicitar",  label: "Nova solicitação", icon: PlusSquare },
    { to: "/app/vagas",      label: "Minhas vagas", icon: Briefcase },
    { to: "/app/candidatos", label: "Candidatos", icon: Users },
    { to: "/app/mensagens",  label: "Mensagens", icon: MessageSquare },
    { to: "/app/perfil",     label: "Perfil da empresa", icon: UserCircle },
  ],
  admin: [
    { to: "/app",            label: "Visão geral", icon: LayoutDashboard, end: true },
  ],
};

export default function DashboardLayout() {
  const { user, profile, activeRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotifications();

  useEffect(() => { if (!loading && !user) setAuthOpen(true); }, [loading, user]);

  // redireciona para onboarding se incompleto
  useEffect(() => {
    if (!loading && user && profile && !profile.onboarding_completed) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-gradient-soft"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-soft p-6">
        <div className="max-w-sm text-center">
          <Logo className="justify-center mb-4" />
          <h2 className="font-display text-2xl font-bold">Entre para acessar o painel</h2>
          <p className="text-sm text-muted-foreground mt-2">Crie sua conta gratuita ou faça login para continuar.</p>
          <div className="flex gap-2 justify-center mt-5">
            <Button variant="hero" onClick={() => setAuthOpen(true)}>Entrar agora</Button>
            <Button variant="outline" onClick={() => navigate("/")}>Voltar à home</Button>
          </div>
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  const role: UserRole = activeRole ?? "individual";
  const nav = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.individual;
  const roleMeta = ROLE_META[role];
  const RoleIcon = roleMeta.icon;
  const displayName = profile?.display_name || profile?.full_name || user.email || "Você";
  const initials = displayName.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <Logo variant="light" />
          <button className="lg:hidden p-1" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>

        <div className="px-4">
          <div className="rounded-xl bg-sidebar-accent/60 p-3 flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-sidebar-primary/30">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{displayName}</div>
              <div className="text-[10px] text-sidebar-foreground/70 truncate">{user.email}</div>
            </div>
          </div>
          <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${roleMeta.color}`}>
            <RoleIcon className="h-3 w-3" /> {roleMeta.label}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 mt-5 space-y-0.5">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to} to={item.to} end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                           : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-xl flex items-center gap-3 px-4 lg:px-8">
          <button className="lg:hidden p-2" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar serviços, freelancers, vagas..." className="pl-9 bg-secondary/50 border-secondary" />
          </div>
          <NotificationsPopover>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold grid place-items-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </NotificationsPopover>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
