import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestSchema } from "@/lib/validation";
import { toast } from "sonner";
import { MapPin, Loader2, ImagePlus, X, Save } from "lucide-react";
import { getBrowserLocation, geocodeAddress } from "@/lib/geo";

export default function RequestNew() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("limpeza");
  const [budget, setBudget] = useState<number>(0);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [state, setState] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && !editing) {
      setCity(profile.city ?? ""); setNeighborhood(profile.neighborhood ?? "");
      setState(profile.state ?? ""); setLat(profile.latitude); setLng(profile.longitude);
    }
    if (editing && id) {
      supabase.from("help_requests").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (!data) return;
        setTitle(data.title); setDescription(data.description); setCategory(data.category as any);
        setBudget(Number(data.budget)); setCity(data.city); setNeighborhood(data.neighborhood ?? "");
        setState(data.state ?? ""); setScheduledAt(data.scheduled_at?.slice(0, 16) ?? "");
        setLat(data.latitude); setLng(data.longitude); setImages(data.image_urls ?? []);
      });
    }
  }, [profile, editing, id]);

  const useMyLocation = async () => {
    try {
      const pos = await getBrowserLocation();
      setLat(pos.latitude); setLng(pos.longitude);
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.latitude}&lon=${pos.longitude}`);
      const j = await r.json();
      if (j?.address) {
        setCity(j.address.city || j.address.town || j.address.village || city);
        setNeighborhood(j.address.suburb || j.address.neighbourhood || "");
        setState(j.address.state_code || j.address.state || "");
      }
      toast.success("Localização capturada");
    } catch { toast.error("Permita a localização"); }
  };

  const onUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("request-images").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("request-images").getPublicUrl(path);
      setImages((arr) => [...arr, data.publicUrl]);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!user) { toast.error("Faça login"); return; }
    const parsed = requestSchema.safeParse({ title, description, category, budget, city, neighborhood, scheduled_at: scheduledAt });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setSaving(true);
    try {
      let llat = lat, llng = lng;
      if (llat == null || llng == null) {
        const g = await geocodeAddress(`${neighborhood ? neighborhood + ", " : ""}${city}${state ? ", " + state : ""}`);
        if (g) { llat = g.latitude; llng = g.longitude; }
      }
      const payload = {
        author_id: user.id,
        title, description, category, budget,
        city, neighborhood: neighborhood || null, state: state || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        latitude: llat, longitude: llng,
        image_urls: images,
      };
      if (editing && id) {
        const { error } = await supabase.from("help_requests").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Solicitação atualizada");
      } else {
        const { error } = await supabase.from("help_requests").insert(payload);
        if (error) throw error;
        toast.success("Solicitação publicada!");
      }
      navigate("/app/feed");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{editing ? "Editar solicitação" : "Solicitar um help"}</h1>
        <p className="text-muted-foreground mt-1">Descreva o que precisa e receba propostas de profissionais próximos.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <Field label="Título *">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pintura de sala 20m²" />
        </Field>
        <Field label="Descrição detalhada *">
          <Textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Detalhe o serviço, materiais, prazo, condições..." />
        </Field>

        <div>
          <Label className="text-xs font-medium text-muted-foreground">Categoria *</Label>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {CATEGORIES.map(c => {
              const m = CATEGORY_META[c];
              const Icon = m.icon;
              const active = category === c;
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <Icon className="h-4 w-4" /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Orçamento (R$) *">
            <Input type="number" min={0} value={budget} onChange={e => setBudget(+e.target.value)} />
          </Field>
          <Field label="Quando (opcional)">
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          </Field>
        </div>

        <Button variant="outline" onClick={useMyLocation} className="w-full">
          <MapPin className="h-4 w-4" /> Usar minha localização
        </Button>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Cidade *"><Input value={city} onChange={e => setCity(e.target.value)} /></Field>
          <Field label="Bairro"><Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} /></Field>
          <Field label="UF"><Input value={state} maxLength={2} onChange={e => setState(e.target.value.toUpperCase())} /></Field>
        </div>
        {lat && lng && <p className="text-xs text-success">✓ Coordenadas: {lat.toFixed(4)}, {lng.toFixed(4)}</p>}

        <div>
          <Label className="text-xs font-medium text-muted-foreground">Fotos (até 6)</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((u, i) => (
              <div key={u} className="relative h-20 w-20 rounded-lg overflow-hidden border">
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button onClick={() => setImages(arr => arr.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
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
            {editing ? "Salvar alterações" : "Publicar solicitação"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
