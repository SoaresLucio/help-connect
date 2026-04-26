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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { RequestCategory } from "@/lib/types";
import { toast } from "sonner";

export default function OfferNew() {
  const { user } = useAuth();
  const { addOffer } = useData();
  const navigate = useNavigate();

  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory>("reparos");
  const [pricingType, setPricingType] = useState<"hour" | "fixed">("hour");
  const [pricingValue, setPricingValue] = useState(80);
  const [coverage, setCoverage] = useState("");
  const [city, setCity] = useState("São Paulo");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !description || !coverage) {
      toast.error("Preencha todos os campos obrigatórios."); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    addOffer({
      freelancerId: user.id, freelancerName: user.name,
      serviceName, description, category,
      pricing: { type: pricingType, value: pricingValue },
      coverage, city,
    });
    toast.success("Anúncio publicado com sucesso!");
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
          <h1 className="font-display text-2xl font-bold">Anunciar um serviço</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Crie sua vitrine e seja encontrado por quem precisa.</p>
        </div>

        <form onSubmit={submit} className="p-7 space-y-5">
          <Field label="Nome do serviço *">
            <Input placeholder="Ex: Eletricista residencial certificado" value={serviceName} onChange={e => setServiceName(e.target.value)} />
          </Field>

          <Field label="Descrição das suas habilidades *">
            <Textarea rows={4} placeholder="Conte sua experiência, qualificações e o que entrega de melhor." value={description} onChange={e => setDescription(e.target.value)} />
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

            <Field label="Cidade base">
              <Input value={city} onChange={e => setCity(e.target.value)} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Modelo de cobrança">
              <RadioGroup value={pricingType} onValueChange={v => setPricingType(v as any)} className="grid grid-cols-2 gap-2">
                <label className={`cursor-pointer rounded-lg border p-3 text-center text-sm font-medium transition-all ${pricingType === "hour" ? "border-accent bg-accent-soft" : "border-border bg-card"}`}>
                  <RadioGroupItem value="hour" className="sr-only" /> Por hora
                </label>
                <label className={`cursor-pointer rounded-lg border p-3 text-center text-sm font-medium transition-all ${pricingType === "fixed" ? "border-accent bg-accent-soft" : "border-border bg-card"}`}>
                  <RadioGroupItem value="fixed" className="sr-only" /> Valor fixo
                </label>
              </RadioGroup>
            </Field>

            <Field label={`Valor cobrado (R$ ${pricingType === "hour" ? "/hora" : "fixo"})`}>
              <Input type="number" min={0} value={pricingValue} onChange={e => setPricingValue(Number(e.target.value))} />
            </Field>
          </div>

          <Field label="Área de abrangência *">
            <Input placeholder="Ex: Zona Oeste de SP — até 15km" value={coverage} onChange={e => setCoverage(e.target.value)} />
          </Field>

          <Field label="Portfólio / fotos de feedback (opcional)">
            <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-secondary/30 p-8 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Adicionar fotos de trabalhos anteriores</span>
              <input type="file" accept="image/*" multiple className="hidden" />
            </label>
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" variant="hero" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publicar anúncio
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
