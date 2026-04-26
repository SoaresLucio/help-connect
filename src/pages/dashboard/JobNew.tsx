import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
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

export default function JobNew() {
  const { user } = useAuth();
  const { addJob } = useData();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory>("outros");
  const [salary, setSalary] = useState("");
  const [city, setCity] = useState("São Paulo");
  const [modality, setModality] = useState<"presencial" | "hibrido" | "remoto">("presencial");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !salary) { toast.error("Preencha os campos obrigatórios."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    addJob({
      companyId: user.id, companyName: user.companyName || user.name,
      title, description, category, salary, city, modality,
    });
    toast.success("Vaga publicada!");
    navigate("/app/vagas");
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
          <h1 className="font-display text-2xl font-bold">Nova vaga formal</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Publique uma vaga e gerencie candidatos no kanban.</p>
        </div>

        <form onSubmit={submit} className="p-7 space-y-5">
          <Field label="Título da vaga *">
            <Input placeholder="Ex: Barista Pleno" value={title} onChange={e => setTitle(e.target.value)} />
          </Field>
          <Field label="Descrição da vaga *">
            <Textarea rows={5} placeholder="Atribuições, requisitos, benefícios..." value={description} onChange={e => setDescription(e.target.value)} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Categoria">
              <Select value={category} onValueChange={v => setCategory(v as RequestCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Modalidade">
              <Select value={modality} onValueChange={v => setModality(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="remoto">Remoto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cidade">
              <Input value={city} onChange={e => setCity(e.target.value)} />
            </Field>
            <Field label="Salário / faixa *">
              <Input placeholder="Ex: R$ 2.800 + benefícios" value={salary} onChange={e => setSalary(e.target.value)} />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" variant="hero" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publicar vaga
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
