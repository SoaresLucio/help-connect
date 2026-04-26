import { motion, Reorder } from "framer-motion";
import { useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import { CandidateStatus, JobApplication } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const COLUMNS: { key: CandidateStatus; label: string; tone: string; ring: string }[] = [
  { key: "pending",  label: "Pendente",   tone: "bg-muted text-muted-foreground",     ring: "ring-muted-foreground/20" },
  { key: "review",   label: "Em análise", tone: "bg-info/10 text-info",                ring: "ring-info/30" },
  { key: "hired",    label: "Contratado", tone: "bg-success/10 text-success",          ring: "ring-success/30" },
  { key: "rejected", label: "Rejeitado",  tone: "bg-destructive/10 text-destructive",  ring: "ring-destructive/30" },
];

export default function CandidatesKanban() {
  const { jobs, applications, updateApplicationStatus } = useData();
  const [jobId, setJobId] = useState<string>(jobs[0]?.id || "");

  const grouped = useMemo(() => {
    const filtered = applications.filter(a => a.jobId === jobId);
    return COLUMNS.reduce((acc, col) => {
      acc[col.key] = filtered.filter(a => a.status === col.key);
      return acc;
    }, {} as Record<CandidateStatus, JobApplication[]>);
  }, [applications, jobId]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Painel de candidatos</h1>
          <p className="text-muted-foreground text-sm mt-1">Arraste ou use o menu para mover candidatos entre os status.</p>
        </div>
        <div className="w-full sm:w-72">
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger><SelectValue placeholder="Selecione uma vaga" /></SelectTrigger>
            <SelectContent>
              {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col, ci) => (
          <motion.div
            key={col.key}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: ci * 0.05 }}
            className="rounded-xl bg-secondary/40 border p-3 flex flex-col min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${col.tone}`}>
                {col.label}
              </span>
              <span className="text-xs font-medium text-muted-foreground">{grouped[col.key].length}</span>
            </div>

            <div className="space-y-2 flex-1">
              {grouped[col.key].length === 0 ? (
                <div className="text-xs text-muted-foreground/70 text-center py-8 border-2 border-dashed rounded-lg">
                  Sem candidatos
                </div>
              ) : grouped[col.key].map(app => {
                const initials = app.candidateName.split(" ").map(s => s[0]).slice(0, 2).join("");
                return (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -2 }}
                    className={`group rounded-lg bg-card p-3 shadow-sm hover:shadow-md transition-all ring-1 ${col.ring}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{app.candidateName}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{app.candidateHeadline}</div>
                        <div className="text-[10px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> {new Date(app.appliedAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-secondary">
                            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {COLUMNS.filter(c => c.key !== app.status).map(c => (
                            <DropdownMenuItem key={c.key} onClick={() => updateApplicationStatus(app.id, c.key)}>
                              Mover para <span className="font-semibold ml-1">{c.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
