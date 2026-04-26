import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Briefcase, MessageSquare, PlusSquare, TrendingUp, Users, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useData } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { OfferCard } from "@/components/OfferCard";
import { CATEGORY_META, formatBRL } from "@/lib/categories";

export default function DashboardHome() {
  const { user } = useAuth();
  const { requests, offers, jobs, applications, threads } = useData();
  if (!user) return null;

  const greeting = `Olá, ${user.name.split(" ")[0]}`;

  const statsByRole = {
    individual: [
      { label: "Solicitações ativas", value: 2, icon: PlusSquare, tone: "text-accent bg-accent/10" },
      { label: "Mensagens",           value: threads.length, icon: MessageSquare, tone: "text-info bg-info/10" },
      { label: "Investido",           value: formatBRL(1240), icon: Wallet, tone: "text-success bg-success/10" },
      { label: "Profissionais salvos",value: 8, icon: Users, tone: "text-primary bg-primary/10" },
    ],
    freelancer: [
      { label: "Anúncios ativos",     value: 3, icon: Briefcase, tone: "text-accent bg-accent/10" },
      { label: "Demandas próximas",   value: requests.length, icon: TrendingUp, tone: "text-info bg-info/10" },
      { label: "Recebido no mês",     value: formatBRL(4820), icon: Wallet, tone: "text-success bg-success/10" },
      { label: "Mensagens",           value: threads.length, icon: MessageSquare, tone: "text-primary bg-primary/10" },
    ],
    company: [
      { label: "Vagas abertas",       value: jobs.filter(j => j.status === "open").length, icon: Briefcase, tone: "text-accent bg-accent/10" },
      { label: "Candidatos",          value: applications.length, icon: Users, tone: "text-info bg-info/10" },
      { label: "Solicitações ativas", value: 4, icon: PlusSquare, tone: "text-success bg-success/10" },
      { label: "Conversas",           value: threads.length, icon: MessageSquare, tone: "text-primary bg-primary/10" },
    ],
  } as const;

  const stats = statsByRole[user.role];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-hero text-primary-foreground p-7 lg:p-10"
      >
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-sm text-primary-foreground/70">{greeting} 👋</p>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">
              {user.role === "freelancer" && "Veja as melhores demandas perto de você"}
              {user.role === "individual" && "Encontre quem resolve seu próximo help"}
              {user.role === "company"    && "Gerencie vagas, candidatos e demandas"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.role === "freelancer" && (
              <Link to="/app/oferecer"><Button variant="hero" size="lg"><PlusSquare className="h-4 w-4" /> Anunciar serviço</Button></Link>
            )}
            {user.role !== "freelancer" && (
              <Link to="/app/solicitar"><Button variant="hero" size="lg"><PlusSquare className="h-4 w-4" /> Nova solicitação</Button></Link>
            )}
            {user.role === "company" && (
              <Link to="/app/vagas/nova"><Button variant="outline" size="lg" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/15"><Briefcase className="h-4 w-4" /> Publicar vaga</Button></Link>
            )}
          </div>
        </div>
      </motion.section>

      {/* STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-xl border bg-card p-5 hover:shadow-elev transition-shadow"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${s.tone}`}><Icon className="h-5 w-5" /></div>
              <div className="font-display text-2xl font-bold mt-3">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          );
        })}
      </section>

      {/* CATEGORIAS */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Explorar por categoria</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <Link key={key} to={`/app/feed?cat=${key}`} className="group rounded-xl border bg-card p-3 text-center hover:border-accent hover:shadow-sm transition-all">
                <div className={`mx-auto grid h-10 w-10 place-items-center rounded-lg ${meta.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium mt-2 group-hover:text-accent transition-colors">{meta.label}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEEDS */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title={user.role === "freelancer" ? "Demandas para você" : "Solicitações abertas"} to="/app/feed" />
          <div className="grid gap-4">
            {requests.slice(0, 3).map((r, i) => <RequestCard key={r.id} request={r} index={i} />)}
          </div>
        </div>
        <div>
          <SectionHeader title="Profissionais em destaque" to="/app/feed" />
          <div className="grid gap-4">
            {offers.slice(0, 3).map((o, i) => <OfferCard key={o.id} offer={o} index={i} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <Link to={to} className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:text-accent transition-colors">
        Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
