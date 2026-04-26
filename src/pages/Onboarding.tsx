import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_META, CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { profileSchema } from "@/lib/validation";
import { ArrowRight, ArrowLeft, MapPin, Sparkles, IdCard, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { geocodeAddress, getBrowserLocation, saveStoredLocation } from "@/lib/geo";

const STEPS = ["Localização", "Interesses", "Identidade"];

export default function Onboarding() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [interests, setInterests] = useState<string[]>([]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [doc, setDoc] = useState("");
  const [birth, setBirth] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/", { replace: true });
    if (profile) {
      setFullName(profile.full_name || "");
      setCity(profile.city || ""); setNeighborhood(profile.neighborhood || "");
      setState(profile.state || ""); setPostal(profile.postal_code || "");
      setAddress(profile.address_line || ""); setBio(profile.bio || "");
      setPhone(profile.phone || ""); setDoc(profile.document_id || "");
      setBirth(profile.birth_date || ""); setInterests(profile.interests || []);
      setLat(profile.latitude); setLng(profile.longitude);
      if (profile.onboarding_completed) navigate("/app", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const useMyLocation = async () => {
    setGeoLoading(true);
    try {
      const pos = await getBrowserLocation();
      setLat(pos.latitude); setLng(pos.longitude);
      saveStoredLocation(pos);
      // reverse geocode opcional via Nominatim
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.latitude}&lon=${pos.longitude}`);
        const j = await r.json();
        if (j?.address) {
          setCity(j.address.city || j.address.town || j.address.village || city);
          setNeighborhood(j.address.suburb || j.address.neighbourhood || neighborhood);
          setState(j.address.state || state);
          setPostal(j.address.postcode || postal);
        }
      } catch {}
      toast.success("Localização capturada");
    } catch (e: any) {
      toast.error("Permita a localização ou preencha manualmente");
    } finally { setGeoLoading(false); }
  };

  const toggleInterest = (k: string) => setInterests((arr) => arr.includes(k) ? arr.filter(x => x !== k) : [...arr, k]);

  const next = async () => {
    if (step === 0) {
      const res = profileSchema.pick({ city: true }).safeParse({ city });
      if (!res.success) { toast.error("Informe ao menos a cidade"); return; }
      // se sem geo, tenta geocodificar
      if (lat == null || lng == null) {
        const q = `${address ? address + ", " : ""}${neighborhood ? neighborhood + ", " : ""}${city}${state ? ", " + state : ""}`;
        const g = await geocodeAddress(q);
        if (g) { setLat(g.latitude); setLng(g.longitude); }
      }
    }
    if (step === 1 && interests.length === 0) {
      toast.error("Escolha pelo menos um interesse");
      return;
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  const finish = async () => {
    if (!user) return;
    const parsed = profileSchema.safeParse({
      full_name: fullName, phone, document_id: doc, birth_date: birth, bio,
      city, neighborhood, state, postal_code: postal, address_line: address,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, phone: phone || null, document_id: doc || null,
      document_type: doc ? (doc.replace(/\D/g, "").length > 11 ? "cnpj" : "cpf") : null,
      birth_date: birth || null, bio: bio || null,
      city, neighborhood: neighborhood || null, state: state || null,
      postal_code: postal || null, address_line: address || null,
      latitude: lat, longitude: lng, interests,
      onboarding_completed: true,
    }).eq("user_id", user.id);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Tudo pronto! Bem-vindo ao HelpAqui.");
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container h-16 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-muted-foreground">Configuração inicial</span>
        </div>
      </header>

      <main className="flex-1 container py-10 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>{i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}</div>
                <span className={`text-xs font-medium hidden sm:inline ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border bg-card p-6 lg:p-8 shadow-sm"
          >
            {step === 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground"><MapPin className="h-5 w-5" /></div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Onde você atende ou precisa de help?</h2>
                    <p className="text-sm text-muted-foreground">Usaremos para mostrar profissionais e demandas perto de você.</p>
                  </div>
                </div>
                <Button variant="outline" onClick={useMyLocation} disabled={geoLoading} className="w-full">
                  {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  Usar minha localização atual
                </Button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Cidade *"><Input value={city} onChange={e => setCity(e.target.value)} placeholder="São Paulo" /></Field>
                  <Field label="Bairro"><Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Vila Madalena" /></Field>
                  <Field label="Estado (UF)"><Input value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" /></Field>
                  <Field label="CEP"><Input value={postal} onChange={e => setPostal(e.target.value)} placeholder="00000-000" /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Endereço (opcional)"><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, complemento" /></Field>
                  </div>
                </div>
                {lat && lng && <p className="text-xs text-success">✓ Coordenadas: {lat.toFixed(4)}, {lng.toFixed(4)}</p>}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><Sparkles className="h-5 w-5" /></div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Quais áreas te interessam?</h2>
                    <p className="text-sm text-muted-foreground">Selecione uma ou mais categorias.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(c => {
                    const m = CATEGORY_META[c];
                    const Icon = m.icon;
                    const active = interests.includes(c);
                    return (
                      <button
                        key={c} type="button" onClick={() => toggleInterest(c)}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                          active ? "border-accent bg-accent-soft" : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? "text-accent" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-success text-success-foreground"><IdCard className="h-5 w-5" /></div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Complete seu perfil</h2>
                    <p className="text-sm text-muted-foreground">Esses dados aumentam sua confiança e desbloqueiam pagamentos.</p>
                  </div>
                </div>
                <Field label="Nome completo *"><Input value={fullName} onChange={e => setFullName(e.target.value)} /></Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Telefone / WhatsApp"><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" /></Field>
                  <Field label="CPF ou CNPJ"><Input value={doc} onChange={e => setDoc(e.target.value)} placeholder="000.000.000-00" /></Field>
                  <Field label="Data de nascimento"><Input type="date" value={birth} onChange={e => setBirth(e.target.value)} /></Field>
                </div>
                <Field label="Bio curta">
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte um pouco sobre você ou seu negócio..." rows={3} />
                </Field>
                <p className="text-[11px] text-muted-foreground">Seus dados são usados apenas para verificação interna e nunca são exibidos publicamente sem sua permissão.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="hero" onClick={next}>Avançar <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button variant="hero" onClick={finish} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Concluir e entrar
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
