import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function JobNew() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("outros");
  const [salary, setSalary] = useState("");
  const [city, setCity] = useState(profile?.city ?? "");
  const [modality, setModality] = useState<"presencial" | "hibrido" | "remoto">("presencial");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (title.length < 5 || description.length < 20 || !city) { toast.error("Preencha todos os campos"); return; }
    setSaving(true);
    const { error } = await supabase.from("company_jobs").insert({
      company_id: user.id, title, description, category, salary: salary || null, city, modality,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vaga publicada!");
    navigate("/app/vagas");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Nova vaga formal</h1>
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <Field label="Título *"><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pintor para projeto de 1 mês" /></Field>
        <Field label="Descrição *"><Textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Categoria *</Label>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {CATEGORIES.map(c => {
              const m = CATEGORY_META[c]; const Icon = m.icon; const a = category === c;
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition ${a ? "border-primary bg-primary/5" : "border-border"}`}>
                  <Icon className="h-4 w-4" /> {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Salário / Faixa"><Input value={salary} onChange={e => setSalary(e.target.value)} placeholder="R$ 3.000–4.000" /></Field>
          <Field label="Cidade *"><Input value={city} onChange={e => setCity(e.target.value)} /></Field>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Modalidade</Label>
            <select value={modality} onChange={e => setModality(e.target.value as any)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button variant="hero" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Publicar vaga
          </Button>
        </div>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
