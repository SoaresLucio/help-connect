import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Eye, MapPin, PlusSquare, Users } from "lucide-react";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CATEGORY_META } from "@/lib/categories";

export default function JobsPage() {
  const { user } = useAuth();
  const { jobs, applications } = useData();

  const list = user?.role === "company" ? jobs.filter(j => j.companyId === user.id || true) : jobs;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{user?.role === "company" ? "Minhas vagas" : "Vagas formais"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.role === "company" ? "Gerencie suas vagas e o pipeline de candidatos." : "Oportunidades de emprego formal nas empresas parceiras."}
          </p>
        </div>
        {user?.role === "company" && (
          <Link to="/app/vagas/nova"><Button variant="hero"><PlusSquare className="h-4 w-4" /> Nova vaga</Button></Link>
        )}
      </div>

      <div className="grid gap-4">
        {list.map((j, i) => {
          const apps = applications.filter(a => a.jobId === j.id);
          const meta = CATEGORY_META[j.category];
          const Icon = meta.icon;
          return (
            <motion.article
              key={j.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="rounded-xl border bg-card p-5 hover:shadow-elev transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.tone}`}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                      {j.status === "open" ? "Aberta" : "Encerrada"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {j.modality}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold mt-2">{j.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{j.companyName}</p>
                  <p className="text-sm mt-3 line-clamp-2 text-foreground/80">{j.description}</p>
                  <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {j.city}</span>
                    <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {j.salary}</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {apps.length} candidatos</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {user?.role === "company" ? (
                    <Link to="/app/candidatos">
                      <Button variant="navy" size="sm" className="w-full"><Users className="h-4 w-4" /> Candidatos</Button>
                    </Link>
                  ) : (
                    <Button variant="hero" size="sm">Candidatar-se</Button>
                  )}
                  <Button variant="outline" size="sm"><Eye className="h-4 w-4" /> Detalhes</Button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
