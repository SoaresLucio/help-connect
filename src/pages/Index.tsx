import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Briefcase, Building2, Compass, MessageCircle, Search, ShieldCheck, Sparkles, Star, TrendingUp, User as UserIcon, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero.jpg";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/AuthDialog";
import { OfferCard } from "@/components/OfferCard";
import { seedOffers } from "@/lib/seed";
import { UserRole } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

const Index = () => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>("individual");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const openAuth = (role: UserRole, mode: "signin" | "signup" = "signup") => {
    setAuthRole(role); setAuthMode(mode); setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#empresas" className="hover:text-foreground transition-colors">Para empresas</a>
            <a href="#profissionais" className="hover:text-foreground transition-colors">Profissionais</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/app"><Button variant="navy" size="sm">Abrir painel <ArrowRight className="h-4 w-4" /></Button></Link>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuth("individual", "signin")}>Entrar</Button>
                <Button variant="hero" size="sm" onClick={() => openAuth("individual", "signup")}>Cadastrar</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 bg-grid opacity-[0.06] pointer-events-none" />
        <div className="absolute top-1/4 -right-40 h-[600px] w-[600px] rounded-full bg-accent/20 blur-3xl" />
        <div className="container relative grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-8 items-center py-20 lg:py-28">
          <div>
            <motion.div {...fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Mais de 12.000 profissionais verificados
            </motion.div>
            <motion.h1
              {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}
              className="mt-5 font-display text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight text-balance"
            >
              Conecte-se a quem<br />
              <span className="relative inline-block">
                <span className="relative z-10 text-accent">resolve</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-accent/20 -skew-x-3" />
              </span>{" "}
              perto de você.
            </motion.h1>
            <motion.p
              {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="mt-6 max-w-xl text-lg text-primary-foreground/80 leading-relaxed"
            >
              HelpAqui aproxima freelancers, pessoas e empresas para serviços locais — do reparo
              urgente à vaga formal — com agilidade, transparência e zero burocracia.
            </motion.p>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="mt-8 flex flex-wrap gap-3">
              <Button size="xl" variant="hero" onClick={() => openAuth("individual", "signup")}>
                Preciso de um help <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="xl" variant="outline" className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => openAuth("freelancer", "signup")}>
                Quero oferecer serviços
              </Button>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { v: "12k+", l: "Profissionais" },
                { v: "98%",  l: "Satisfação" },
                { v: "24h",  l: "Resposta média" },
              ].map(s => (
                <div key={s.l}>
                  <div className="font-display text-2xl font-bold text-accent">{s.v}</div>
                  <div className="text-xs text-primary-foreground/60 mt-0.5">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-navy ring-1 ring-primary-foreground/10">
              <img src={heroImg} alt="Profissionais conectados pelo HelpAqui" className="w-full h-auto" width={1536} height={1024} />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="absolute -left-4 lg:-left-8 top-8 bg-card text-foreground rounded-xl shadow-lg p-3 pr-5 flex items-center gap-3 max-w-[230px]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success"><BadgeCheck className="h-5 w-5" /></div>
              <div>
                <div className="text-xs font-semibold">Lucas — Eletricista</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Star className="h-2.5 w-2.5 fill-accent text-accent" /> 4.9 · resposta em 8 min</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -right-2 lg:-right-6 bottom-6 bg-card text-foreground rounded-xl shadow-lg p-3 pr-5 flex items-center gap-3"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent"><Wallet className="h-5 w-5" /></div>
              <div>
                <div className="text-xs font-semibold">Pagamento seguro</div>
                <div className="text-[10px] text-muted-foreground">Liberado só após o serviço</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 bg-background">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Como funciona</span>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tight text-balance">
              Três passos simples para resolver qualquer demanda.
            </h2>
          </motion.div>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { icon: Search,        n: "01", t: "Publique ou busque", d: "Crie uma solicitação detalhada ou explore o feed de freelancers verificados na sua região." },
              { icon: MessageCircle, n: "02", t: "Negocie pelo chat",  d: "Converse, alinhe escopo e valor diretamente com o profissional. Sem intermediários." },
              { icon: ShieldCheck,   n: "03", t: "Pague com segurança",d: "O valor fica retido e só é liberado após sua confirmação. Avalie e siga em frente." },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative rounded-2xl border bg-gradient-card p-7 hover:shadow-elev transition-shadow"
                >
                  <span className="font-display text-5xl font-extrabold text-secondary leading-none group-hover:text-accent/30 transition-colors">{s.n}</span>
                  <div className="mt-4 grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-4 font-display text-xl font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* EMPRESAS */}
      <section id="empresas" className="py-24 bg-secondary/40 border-y">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Para empresas</span>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tight text-balance">
              Contrate freelancers e candidatos formais — em um só lugar.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Painel exclusivo para gestão de demandas pontuais, vagas formais e acompanhamento
              kanban de candidatos. Tudo integrado ao mesmo perfil corporativo.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              {[
                { i: Briefcase,  t: "Vagas com triagem visual" },
                { i: TrendingUp, t: "Métricas de funil em tempo real" },
                { i: ShieldCheck,t: "Profissionais validados" },
                { i: Compass,    t: "Cobertura nacional" },
              ].map(b => {
                const I = b.i;
                return (
                  <div key={b.t} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-accent/10 text-accent"><I className="h-4 w-4" /></div>
                    <span className="text-sm font-medium">{b.t}</span>
                  </div>
                );
              })}
            </div>
            <Button size="lg" variant="navy" className="mt-8" onClick={() => openAuth("company", "signup")}>
              <Building2 className="h-4 w-4" /> Criar conta empresarial
            </Button>
          </motion.div>

          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="relative">
            <div className="rounded-2xl border bg-card p-6 shadow-elev">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display font-semibold">Funil de candidatos · Barista</h4>
                <span className="text-xs text-muted-foreground">12 candidatos</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { l: "Pendente", n: 5, c: "bg-muted text-muted-foreground" },
                  { l: "Análise",  n: 4, c: "bg-info/10 text-info" },
                  { l: "Rejeitado",n: 2, c: "bg-destructive/10 text-destructive" },
                  { l: "Contratado",n:1, c: "bg-success/10 text-success" },
                ].map(col => (
                  <div key={col.l} className="rounded-lg bg-secondary/50 p-2.5">
                    <div className={`text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 inline-block ${col.c}`}>{col.l}</div>
                    <div className="font-display text-2xl font-bold mt-2">{col.n}</div>
                    <div className="space-y-1 mt-2">
                      {Array.from({ length: Math.min(col.n, 3) }).map((_, i) => (
                        <div key={i} className="h-2 rounded bg-card" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section id="profissionais" className="py-24">
        <div className="container">
          <motion.div {...fadeUp} className="flex items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Em destaque</span>
              <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tight">Profissionais top da semana</h2>
            </div>
            <Link to="/app/feed" className="hidden md:inline-flex text-sm font-medium text-primary hover:text-accent transition-colors items-center gap-1">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {seedOffers.slice(0, 6).map((o, i) => <OfferCard key={o.id} offer={o} index={i} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 lg:p-16 text-primary-foreground">
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
              <div>
                <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-balance">
                  Pronto para resolver hoje?
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/80 max-w-lg">
                  Cadastro grátis. Publique sua primeira solicitação em menos de 1 minuto.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <Button size="xl" variant="hero" onClick={() => openAuth("individual", "signup")}>
                  <UserIcon className="h-5 w-5" /> Sou pessoa física
                </Button>
                <Button size="xl" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/15" onClick={() => openAuth("freelancer", "signup")}>
                  <Briefcase className="h-5 w-5" /> Sou freelancer
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-secondary/30">
        <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-muted-foreground">© 2025 HelpAqui · Conectando talentos locais com agilidade.</p>
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultRole={authRole} defaultMode={authMode} />
    </div>
  );
};

export default Index;
