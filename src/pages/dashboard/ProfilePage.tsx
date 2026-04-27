import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileSchema } from "@/lib/validation";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { toast } from "sonner";
import { Camera, Loader2, Save, Star, ShieldCheck, MapPin } from "lucide-react";
import { Review } from "@/lib/types";
import { getBrowserLocation } from "@/lib/geo";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [doc, setDoc] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [address, setAddress] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? ""); setPhone(profile.phone ?? "");
    setDoc(profile.document_id ?? ""); setBio(profile.bio ?? "");
    setCity(profile.city ?? ""); setNeighborhood(profile.neighborhood ?? "");
    setState(profile.state ?? ""); setPostal(profile.postal_code ?? "");
    setAddress(profile.address_line ?? ""); setInterests(profile.interests ?? []);
    setLat(profile.latitude); setLng(profile.longitude);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("reviews").select("*").eq("reviewed_user_id", user.id)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setReviews((data as any) ?? []));
  }, [user]);

  const onAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      await refreshProfile();
      toast.success("Foto atualizada");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const useMyLocation = async () => {
    try {
      const pos = await getBrowserLocation();
      setLat(pos.latitude); setLng(pos.longitude);
      toast.success("Localização capturada");
    } catch { toast.error("Permita a localização"); }
  };

  const save = async () => {
    if (!user) return;
    const parsed = profileSchema.safeParse({
      full_name: fullName, phone, document_id: doc, bio, city, neighborhood, state, postal_code: postal, address_line: address,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, phone: phone || null, document_id: doc || null,
      document_type: doc ? (doc.replace(/\D/g, "").length > 11 ? "cnpj" : "cpf") : null,
      bio: bio || null, city, neighborhood: neighborhood || null, state: state || null,
      postal_code: postal || null, address_line: address || null,
      latitude: lat, longitude: lng, interests,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Perfil salvo!");
  };

  if (!user || !profile) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" /></div>;

  const initials = (fullName || user.email || "U").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const verified = !!profile.identity_verified;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Meu perfil</h1>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="bg-gradient-hero p-6 lg:p-8 text-primary-foreground flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-accent/30">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-accent text-accent-foreground font-bold text-xl">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground rounded-full p-1.5 cursor-pointer hover:scale-110 transition">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onAvatar(e.target.files[0])} />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-2xl font-bold">{fullName || "Sem nome"}</h2>
              {verified && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-success px-2 py-0.5 rounded-full"><ShieldCheck className="h-3 w-3" />Verificado</span>}
            </div>
            <p className="text-primary-foreground/80 text-sm">{user.email}</p>
            {profile.rating_avg > 0 && (
              <div className="text-xs mt-1 inline-flex items-center gap-1"><Star className="h-3 w-3 fill-accent text-accent" /> {profile.rating_avg.toFixed(1)} · {profile.reviews_count} avaliações</div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <Field label="Nome completo *"><Input value={fullName} onChange={e => setFullName(e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Telefone"><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" /></Field>
            <Field label="CPF / CNPJ"><Input value={doc} onChange={e => setDoc(e.target.value)} placeholder="000.000.000-00" /></Field>
          </div>
          <Field label="Bio"><Textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} /></Field>

          <div className="rounded-lg bg-secondary/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Endereço</Label>
              <Button variant="outline" size="sm" onClick={useMyLocation}><MapPin className="h-3 w-3" />Usar minha localização</Button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Cidade *"><Input value={city} onChange={e => setCity(e.target.value)} /></Field>
              <Field label="Bairro"><Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} /></Field>
              <Field label="UF"><Input value={state} maxLength={2} onChange={e => setState(e.target.value.toUpperCase())} /></Field>
              <Field label="CEP"><Input value={postal} onChange={e => setPostal(e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Endereço"><Input value={address} onChange={e => setAddress(e.target.value)} /></Field></div>
            </div>
            {lat && lng && <p className="text-xs text-success">✓ Coordenadas: {lat.toFixed(4)}, {lng.toFixed(4)}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Interesses</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const m = CATEGORY_META[c]; const a = interests.includes(c);
                return (
                  <button key={c} type="button" onClick={() => setInterests(arr => a ? arr.filter(x => x !== c) : [...arr, c])}
                    className={`text-xs px-3 py-1.5 rounded-full border ${a ? "bg-accent text-accent-foreground border-accent" : "border-border"}`}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <Button variant="hero" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar perfil
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-display text-xl font-bold mb-4">Avaliações recebidas</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não tem avaliações.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-1 text-accent">
                  {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                {r.comment && <p className="text-sm mt-2">{r.comment}</p>}
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("pt-BR")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
