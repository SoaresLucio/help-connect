import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { RequestCategory } from "@/lib/types";
import { toast } from "sonner";

export default function RequestNew() {
  const { user } = useAuth();
  const { addRequest } = useData();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory>("reparos");
  const [budget, setBudget] = useState(300);
  const [city, setCity] = useState("São Paulo");
  const [neighborhood, setNeighborhood] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !neighborhood || !scheduledAt) {
      toast.error("Preencha todos os campos obrigatórios."); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    addRequest({
      authorId: user.id, authorName: user.name,
      authorType: user.role === "company" ? "company" : "individual",
      title, description, category, budget, city, neighborhood, scheduledAt,
    });
    toast.success("Solicitação publicada com sucesso!");
    navigate("/app/feed");
  };

  return (
    <div className="max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-card overflow-hidden"
      >
        <div className="bg-gradient-hero text-primary-foreground p-7">
          <h1 className="font-display text-2xl font-bold">Solicitar um help</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Descreva sua demanda e receba propostas em horas.</p>
        </div>

        <form onSubmit={submit} className="p-7 space-y-5">
          <Field label="Título do trabalho *">
            <Input placeholder="Ex: Montagem de guarda-roupa 4 portas" value={title} onChange={e => setTitle(e.target.value)} />
          </Field>

          <Field label="Descrição detalhada *">
            <Textarea rows={4} placeholder="Conte os detalhes do que precisa ser feito, materiais, condições do local..." value={description} onChange={e => setDescription(e.target.value)} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Categoria">
              <Select value={category} onValueChange={v => setCategory(v as RequestCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Valor proposto (R$)">
              <Input type="number" min={0} value={budget} onChange={e => setBudget(Number(e.target.value))} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cidade">
              <Input value={city} onChange={e => setCity(e.target.value)} />
            </Field>
            <Field label="Bairro *">
              <Input placeholder="Ex: Pinheiros" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
            </Field>
          </div>

          <Field label="Data e horário *">
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          </Field>

          <Field label="Foto do local ou serviço (opcional)">
            <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-secondary/30 p-8 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Arraste ou clique para enviar</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" variant="hero" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publicar solicitação
            </Button>
          </div>
        </form>
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
