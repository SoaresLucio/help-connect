import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORY_META } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Briefcase, Send, Loader2 } from "lucide-react";
import { CompanyJob } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { pushNotification } from "@/hooks/useNotifications";

export default function JobsPage() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const isCompany = activeRole === "company";
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("company_jobs").select("*").order("created_at", { ascending: false });
    if (isCompany && user) q = q.eq("company_id", user.id);
    const { data } = await q;
    const rows = (data as any[]) ?? [];
    const ids = Array.from(new Set(rows.map(r => r.company_id)));
    const { data: companies } = ids.length
      ? await supabase.from("profiles_public").select("*").in("user_id", ids)
      : { data: [] as any[] };
    const byId = new Map((companies ?? []).map((c: any) => [c.user_id, c]));
    setJobs(rows.map(r => ({ ...r, company: byId.get(r.company_id) })) as any);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, isCompany]);

  const apply = async (job: CompanyJob) => {
    if (!user) return;
    setApplying(job.id);
    try {
      const { error } = await supabase.from("applications").insert({
        candidate_id: user.id, target_type: "job", target_id: job.id,
        owner_id: job.company_id, status: "pending",
        message: `Tenho interesse na vaga "${job.title}".`,
      });
      if (error) throw error;
      await pushNotification(job.company_id, "Nova candidatura para vaga", `Alguém se candidatou para "${job.title}"`, "application", "/app/candidatos");
      toast.success("Candidatura enviada!");
    } catch (e: any) { toast.error(e.code === "23505" ? "Você já se candidatou" : e.message); }
    finally { setApplying(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">{isCompany ? "Minhas vagas" : "Vagas formais"}</h1>
          <p className="text-muted-foreground mt-1">{isCompany ? "Gerencie vagas e candidatos." : "Vagas publicadas por empresas verificadas."}</p>
        </div>
        {isCompany && <Button variant="hero" onClick={() => navigate("/app/vagas/nova")}><Plus className="h-4 w-4" /> Nova vaga</Button>}
      </div>

      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin" /></div>
       : jobs.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhuma vaga {isCompany ? "publicada por você ainda" : "disponível no momento"}.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((job, i) => {
            const m = CATEGORY_META[job.category]; const Icon = m.icon;
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border bg-card p-5 hover:shadow-elev transition">
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${m.tone}`}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold leading-tight">{job.title}</h3>
                    <div className="text-xs text-muted-foreground mt-0.5">{job.company?.full_name ?? "Empresa"}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${job.status === "open" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {job.status === "open" ? "Aberta" : "Encerrada"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{job.description}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.city}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.modality}</span>
                  {job.salary && <span className="text-foreground font-semibold">{job.salary}</span>}
                </div>
                {!isCompany && job.status === "open" && (
                  <Button size="sm" variant="navy" className="w-full mt-4" onClick={() => apply(job)} disabled={applying === job.id}>
                    {applying === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Candidatar-se
                  </Button>
                )}
                {isCompany && (
                  <Button size="sm" variant="outline" className="w-full mt-4" asChild>
                    <Link to="/app/candidatos">Ver candidatos</Link>
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
