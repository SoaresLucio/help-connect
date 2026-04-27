import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { offerSchema } from "@/lib/validation";
import { toast } from "sonner";
import { MapPin, Loader2, ImagePlus, X, Save } from "lucide-react";
import { getBrowserLocation, geocodeAddress } from "@/lib/geo";

export default function OfferNew() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = !!id;

  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("limpeza");
  const [pricingType, setPricingType] = useState<"hour" | "fixed">("hour");
  const [pricingValue, setPricingValue] = useState<number>(0);
  const [city, setCity] = useState("");
  const [coverage, setCoverage] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && !editing) {
      setCity(profile.city ?? ""); setLat(profile.latitude); setLng(profile.longitude);
    }
    if (editing && id) {
      supabase.from("help_offers").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (!data) return;
        setServiceName(data.service_name); setDescription(data.description);
        setCategory(data.category as any); setPricingType(data.pricing_type as any);
        setPricingValue(Number(data.pricing_value)); setCity(data.city);
        setCoverage(data.coverage ?? ""); setLat(data.latitude); setLng(data.longitude);
        setPortfolio(data.portfolio_urls ?? []); setActive(data.active);
      });
    }
  }, [profile, editing, id]);

  const useMyLocation = async () => {
    try {
      const pos = await getBrowserLocation();
      setLat(pos.latitude); setLng(pos.longitude);
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.latitude}&lon=${pos.longitude}`);
      const j = await r.json();
      if (j?.address) setCity(j.address.city || j.address.town || j.address.village || city);
      toast.success("Localização capturada");
    } catch { toast.error("Permita a localização"); }
  };

  const onUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("offer-portfolios").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("offer-portfolios").getPublicUrl(path);
      setPortfolio(arr => [...arr, data.publicUrl]);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!user) { toast.error("Faça login"); return; }
    const parsed = offerSchema.safeParse({ service_name: serviceName, description, category, pricing_type: pricingType, pricing_value: pricingValue, city, coverage });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setSaving(true);
    try {
      let llat = lat, llng = lng;
      if (llat == null || llng == null) {
        const g = await geocodeAddress(city);
        if (g) { llat = g.latitude; llng = g.longitude; }
      }
      const payload = {
        freelancer_id: user.id, service_name: serviceName, description, category,
        pricing_type: pricingType, pricing_value: pricingValue,
        city, coverage: coverage || null, latitude: llat, longitude: llng,
        portfolio_urls: portfolio, active,
      };
      if (editing && id) {
        const { error } = await supabase.from("help_offers").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Oferta atualizada");
      } else {
        const { error } = await supabase.from("help_offers").insert(payload);
        if (error) throw error;
        toast.success("Oferta publicada!");
      }
      navigate("/app/feed");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{editing ? "Editar oferta" : "Anunciar serviço"}</h1>
        <p className="text-muted-foreground mt-1">Crie uma oferta atraente para receber contatos qualificados.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <Field label="Nome do serviço *">
          <Input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Ex: Pintura residencial profissional" />
        </Field>
        <Field label="Descrição *">
          <Textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Conte sua experiência, o que está incluído, garantias..." />
        </Field>

        <div>
          <Label className="text-xs font-medium text-muted-foreground">Categoria *</Label>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {CATEGORIES.map(c => {
              const m = CATEGORY_META[c]; const Icon = m.icon; const a = category === c;
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition ${a ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <Icon className="h-4 w-4" /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Cobrança *</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPricingType("hour")}
                className={`rounded-lg border p-2 text-xs ${pricingType === "hour" ? "border-primary bg-primary/5" : ""}`}>Por hora</button>
              <button type="button" onClick={() => setPricingType("fixed")}
                className={`rounded-lg border p-2 text-xs ${pricingType === "fixed" ? "border-primary bg-primary/5" : ""}`}>Valor fixo</button>
            </div>
          </div>
          <Field label={pricingType === "hour" ? "R$/hora *" : "Valor (R$) *"}>
            <Input type="number" min={0} value={pricingValue} onChange={e => setPricingValue(+e.target.value)} />
          </Field>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
              Oferta ativa
            </label>
          </div>
        </div>

        <Button variant="outline" onClick={useMyLocation} className="w-full">
          <MapPin className="h-4 w-4" /> Usar minha localização
        </Button>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Cidade *"><Input value={city} onChange={e => setCity(e.target.value)} /></Field>
          <Field label="Áreas atendidas"><Input value={coverage} onChange={e => setCoverage(e.target.value)} placeholder="Zona Sul, até 30km..." /></Field>
        </div>
        {lat && lng && <p className="text-xs text-success">✓ Coordenadas: {lat.toFixed(4)}, {lng.toFixed(4)}</p>}

        <div>
          <Label className="text-xs font-medium text-muted-foreground">Portfólio (até 8)</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {portfolio.map((u, i) => (
              <div key={u} className="relative h-20 w-20 rounded-lg overflow-hidden border">
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button onClick={() => setPortfolio(arr => arr.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {portfolio.length < 8 && (
              <label className="h-20 w-20 rounded-lg border-2 border-dashed grid place-items-center cursor-pointer hover:border-primary text-muted-foreground">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button variant="hero" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? "Salvar alterações" : "Publicar oferta"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
