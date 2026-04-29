import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { HelpRequest, HelpOffer, UserRole } from "@/lib/types";
import { CATEGORY_META, formatBRL } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Locate, X, MessageSquare, ArrowRight, Inbox, Briefcase, Users } from "lucide-react";
import { getBrowserLocation, getStoredLocation, saveStoredLocation, haversineKm } from "@/lib/geo";
import { ApplyToRequestDialog } from "@/components/ApplyToRequestDialog";
import { ContactProfessionalDialog } from "@/components/ContactProfessionalDialog";
import { RequestCard } from "@/components/RequestCard";
import { OfferCard } from "@/components/OfferCard";
import { useNavigate, Link } from "react-router-dom";

type MapMode = "work" | "hire" | "both";
type Pin =
  | { kind: "request"; data: HelpRequest; lat: number; lng: number }
  | { kind: "offer"; data: HelpOffer; lat: number; lng: number };

const MOCK_REQUESTS: any[] = [
  { id: "mock-r1", title: "Pintura de sala 30m²", description: "Preciso de pintura completa.", category: "reparos", budget: 800, city: "São Paulo", latitude: -23.561, longitude: -46.656, image_urls: [], status: "open", proposals_count: 0, author_id: "mock", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), neighborhood: "Centro", state: "SP", scheduled_at: null },
  { id: "mock-r2", title: "Faxina apartamento 2 quartos", description: "Limpeza pesada após reforma.", category: "limpeza", budget: 250, city: "São Paulo", latitude: -23.549, longitude: -46.638, image_urls: [], status: "open", proposals_count: 0, author_id: "mock", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), neighborhood: null, state: "SP", scheduled_at: null },
  { id: "mock-r3", title: "Aulas de inglês online", description: "Conversação nível intermediário.", category: "aulas", budget: 120, city: "São Paulo", latitude: -23.540, longitude: -46.630, image_urls: [], status: "open", proposals_count: 0, author_id: "mock", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), neighborhood: "Pinheiros", state: "SP", scheduled_at: null },
];
const MOCK_OFFERS: any[] = [
  { id: "mock-o1", service_name: "Pintor profissional 10 anos", description: "Atendimento completo SP.", category: "reparos", pricing_type: "hour", pricing_value: 80, city: "São Paulo", latitude: -23.555, longitude: -46.640, portfolio_urls: [], active: true, freelancer_id: "mock", coverage: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), freelancer: { full_name: "João Pintor", display_name: "João", rating_avg: 4.8, reviews_count: 24, avatar_url: null } },
  { id: "mock-o2", service_name: "Diarista experiente", description: "Limpeza completa.", category: "limpeza", pricing_type: "fixed", pricing_value: 180, city: "São Paulo", latitude: -23.567, longitude: -46.650, portfolio_urls: [], active: true, freelancer_id: "mock", coverage: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), freelancer: { full_name: "Maria Limpeza", display_name: "Maria", rating_avg: 4.9, reviews_count: 41, avatar_url: null } },
  { id: "mock-o3", service_name: "Dev Frontend React", description: "Sites e apps modernos.", category: "tecnologia", pricing_type: "hour", pricing_value: 150, city: "São Paulo", latitude: -23.545, longitude: -46.645, portfolio_urls: [], active: true, freelancer_id: "mock", coverage: "Remoto Brasil", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), freelancer: { full_name: "Carlos Dev", display_name: "Carlos", rating_avg: 5.0, reviews_count: 12, avatar_url: null } },
];

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];

function pinIcon(html: string) {
  return L.divIcon({ className: "", html: `<div class="ha-pin">${html}</div>`, iconSize: [44, 44], iconAnchor: [22, 44] });
}
function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, Math.max(map.getZoom(), 13), { duration: 0.8 }); }, [center, map]);
  return null;
}
function labelIcon(cat: string) {
  const map: Record<string, string> = { limpeza: "🧹", reparos: "🔨", tecnologia: "💻", design: "🎨", aulas: "📚", transporte: "🚚", eventos: "🎉", beleza: "✂️", outros: "✨" };
  return map[cat] ?? "✨";
}

export default function DashboardHome() {
  const { profile, activeRole, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const role: UserRole = activeRole ?? "individual";
  const defaultMode: MapMode = role === "freelancer" ? "work" : "hire";
  const [mode, setMode] = useState<MapMode>(defaultMode);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [offers, setOffers] = useState<HelpOffer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [geo, setGeo] = useState<{ latitude: number; longitude: number } | null>(getStoredLocation() ?? (profile?.latitude && profile?.longitude ? { latitude: profile.latitude, longitude: profile.longitude } : null));
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [selected, setSelected] = useState<Pin | null>(null);
  const [applyReq, setApplyReq] = useState<HelpRequest | null>(null);
  const [contactOff, setContactOff] = useState<HelpOffer | null>(null);

  // sync mode with role
  useEffect(() => { setMode(defaultMode); }, [defaultMode]);

  useEffect(() => {
    (async () => {
      setLoadingData(true);
      const [{ data: reqRows }, { data: offRows }] = await Promise.all([
        supabase.from("help_requests").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(200),
        supabase.from("help_offers").select("*").eq("active", true).order("created_at", { ascending: false }).limit(200),
      ]);
      const realReqs = (reqRows as any[]) ?? [];
      const realOffs = (offRows as any[]) ?? [];

      // enrich with profiles_public
      const allIds = Array.from(new Set([
        ...realReqs.map(r => r.author_id),
        ...realOffs.map(o => o.freelancer_id),
      ]));
      if (allIds.length) {
        const { data: profs } = await supabase.from("profiles_public").select("*").in("user_id", allIds);
        const byId = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        realReqs.forEach((r: any) => { r.author = byId.get(r.author_id); });
        realOffs.forEach((o: any) => { o.freelancer = byId.get(o.freelancer_id); });
      }

      setRequests(realReqs.length > 0 ? realReqs : MOCK_REQUESTS);
      setOffers(realOffs.length > 0 ? realOffs : MOCK_OFFERS);
      setLoadingData(false);
    })();
  }, []);

  const locate = async () => {
    try { const pos = await getBrowserLocation(); setGeo(pos); saveStoredLocation(pos); setCenter([pos.latitude, pos.longitude]); } catch { /* ignore */ }
  };

  const initialCenter: [number, number] = geo ? [geo.latitude, geo.longitude] : DEFAULT_CENTER;

  const pins: Pin[] = useMemo(() => {
    const list: Pin[] = [];
    if (mode === "work") {
      requests.forEach(r => r.latitude && r.longitude && list.push({ kind: "request", data: r, lat: r.latitude, lng: r.longitude }));
    } else {
      offers.forEach(o => o.latitude && o.longitude && list.push({ kind: "offer", data: o, lat: o.latitude, lng: o.longitude }));
    }
    if (geo) return list.filter(p => haversineKm(geo, { latitude: p.lat, longitude: p.lng }) <= radiusKm);
    return list;
  }, [mode, requests, offers, geo, radiusKm]);

  // Sort by distance if we have geo
  const sortedRequests = useMemo(() => {
    const arr = [...requests];
    if (geo) arr.forEach((r: any) => { if (r.latitude && r.longitude) r.distance_km = haversineKm(geo, { latitude: r.latitude, longitude: r.longitude }); });
    return arr.sort((a: any, b: any) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
  }, [requests, geo]);
  const sortedOffers = useMemo(() => {
    const arr = [...offers];
    if (geo) arr.forEach((o: any) => { if (o.latitude && o.longitude) o.distance_km = haversineKm(geo, { latitude: o.latitude, longitude: o.longitude }); });
    return arr.sort((a: any, b: any) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
  }, [offers, geo]);

  // Role-driven list
  const listConfig = useMemo(() => {
    if (role === "freelancer") return {
      kind: "requests" as const, title: "Solicitações de Help próximas",
      subtitle: "Demandas publicadas por clientes — envie sua proposta.",
      ctaLabel: "Ver todas", ctaLink: "/app/feed",
    };
    // individual or company: show offers from freelancers
    return {
      kind: "offers" as const,
      title: role === "company" ? "Profissionais para sua empresa" : "Profissionais perto de você",
      subtitle: "Ofertas de Help publicadas por freelancers verificados.",
      ctaLabel: "Ver todos", ctaLink: "/app/feed",
    };
  }, [role]);

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[320px] w-full rounded-2xl" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? profile?.display_name?.split(" ")[0] ?? "bem-vindo";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Olá, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm">Explore solicitações e profissionais ao seu redor.</p>
        </div>
        <div className="flex gap-2">
          {role === "freelancer" ? (
            <Button variant="hero" size="sm" onClick={() => navigate("/app/oferecer")}>Anunciar serviço</Button>
          ) : (
            <Button variant="hero" size="sm" onClick={() => navigate("/app/solicitar")}>Solicitar help</Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsRow role={role} />

      {/* Mapa reduzido */}
      <section className="relative rounded-2xl border bg-card overflow-hidden h-[340px] lg:h-[380px]">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] rounded-full bg-card/95 backdrop-blur border shadow-lg px-3 py-1.5 flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${mode === "work" ? "text-primary" : "text-muted-foreground"}`}>Trabalhar</span>
          <Switch checked={mode === "hire"} onCheckedChange={(v) => setMode(v ? "hire" : "work")} />
          <span className={`text-[11px] font-semibold ${mode === "hire" ? "text-primary" : "text-muted-foreground"}`}>Contratar</span>
        </div>

        <div className="absolute top-3 right-3 z-[500]">
          <Button size="sm" variant="hero" onClick={locate}><Locate className="h-4 w-4" />Localizar</Button>
        </div>

        {geo && (
          <div className="absolute bottom-3 left-3 right-3 lg:right-auto lg:w-72 z-[500] rounded-2xl bg-card/95 backdrop-blur border shadow-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold">Raio</span>
              <span className="text-primary font-bold">{radiusKm} km</span>
            </div>
            <Slider value={[radiusKm]} onValueChange={v => setRadiusKm(v[0])} min={1} max={50} step={1} />
            <div className="text-[10px] text-muted-foreground mt-1.5">{pins.length} {mode === "work" ? "solicitações" : "ofertas"} na área</div>
          </div>
        )}

        <MapContainer center={initialCenter} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer attribution='&copy; CARTO &copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <FlyTo center={center} />
          <AnimatePresence>
            {pins.map((p, i) => {
              const html = p.kind === "request"
                ? `<div class="ha-pin-bubble bg-primary text-primary-foreground"><span>${labelIcon(p.data.category)}</span><span>${formatBRL((p.data as HelpRequest).budget)}</span></div>`
                : `<div class="ha-pin-bubble bg-accent text-accent-foreground"><span>★ ${(((p.data as HelpOffer).freelancer?.rating_avg ?? 0)).toFixed(1)}</span></div>`;
              return <Marker key={`${p.kind}-${p.data.id}-${i}`} position={[p.lat, p.lng]} icon={pinIcon(html)} eventHandlers={{ click: () => setSelected(p) }} />;
            })}
          </AnimatePresence>
        </MapContainer>

        <style>{`
          .ha-pin { transform-origin: bottom center; animation: ha-pop .35s cubic-bezier(.16,1,.3,1); }
          @keyframes ha-pop { from { transform: translateY(-8px) scale(.8); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
          .ha-pin-bubble { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; font-size: 11px; padding: 6px 10px; border-radius: 999px; box-shadow: 0 8px 20px -6px rgba(0,0,0,.35); border: 2px solid white; white-space: nowrap; position: relative; }
          .leaflet-container { font-family: 'Inter', system-ui, sans-serif; }
        `}</style>
      </section>

      {/* Lista por papel */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold">{listConfig.title}</h2>
            <p className="text-sm text-muted-foreground">{listConfig.subtitle}</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to={listConfig.ctaLink}>{listConfig.ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {loadingData ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : listConfig.kind === "requests" ? (
          sortedRequests.length === 0 ? (
            <EmptyState icon={Inbox} text="Nenhuma solicitação aberta no momento." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedRequests.slice(0, 6).map((r, i) => (
                <RequestCard key={r.id} request={r} index={i} onApply={setApplyReq} />
              ))}
            </div>
          )
        ) : (
          sortedOffers.length === 0 ? (
            <EmptyState icon={Users} text="Nenhum profissional encontrado." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedOffers.slice(0, 6).map((o, i) => (
                <OfferCard key={o.id} offer={o} index={i} onContact={setContactOff} onView={(off) => navigate(`/u/${off.freelancer_id}`)} />
              ))}
            </div>
          )
        )}
      </section>

      {/* Drawer do mapa */}
      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="max-h-[85vh]">
          {selected && (selected.kind === "request" ? (
            <RequestDetail r={selected.data} onApply={() => { setApplyReq(selected.data); setSelected(null); }} onClose={() => setSelected(null)} />
          ) : (
            <OfferDetail o={selected.data} onContact={() => { setContactOff(selected.data); setSelected(null); }} onView={() => { navigate(`/u/${selected.data.freelancer_id}`); setSelected(null); }} onClose={() => setSelected(null)} />
          ))}
        </DrawerContent>
      </Drawer>

      <ApplyToRequestDialog request={applyReq} onClose={() => setApplyReq(null)} />
      <ContactProfessionalDialog offer={contactOff} onClose={() => setContactOff(null)} />
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function StatsRow({ role }: { role: UserRole }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ a: 0, b: 0, c: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (role === "freelancer") {
        const [apps, off, msgs] = await Promise.all([
          supabase.from("applications").select("id", { count: "exact", head: true }).eq("candidate_id", user.id),
          supabase.from("help_offers").select("id", { count: "exact", head: true }).eq("freelancer_id", user.id).eq("active", true),
          supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
        ]);
        setStats({ a: apps.count ?? 0, b: off.count ?? 0, c: msgs.count ?? 0 });
      } else if (role === "company") {
        const [jobs, apps, msgs] = await Promise.all([
          supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("company_id", user.id).eq("status", "open"),
          supabase.from("applications").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
          supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
        ]);
        setStats({ a: jobs.count ?? 0, b: apps.count ?? 0, c: msgs.count ?? 0 });
      } else {
        const [reqs, apps, msgs] = await Promise.all([
          supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("author_id", user.id).eq("status", "open"),
          supabase.from("applications").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
          supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
        ]);
        setStats({ a: reqs.count ?? 0, b: apps.count ?? 0, c: msgs.count ?? 0 });
      }
    })();
  }, [role, user]);

  const items = role === "freelancer"
    ? [{ label: "Candidaturas enviadas", value: stats.a, icon: Inbox }, { label: "Anúncios ativos", value: stats.b, icon: Briefcase }, { label: "Notificações", value: stats.c, icon: MessageSquare }]
    : role === "company"
    ? [{ label: "Vagas abertas", value: stats.a, icon: Briefcase }, { label: "Candidatos recebidos", value: stats.b, icon: Users }, { label: "Notificações", value: stats.c, icon: MessageSquare }]
    : [{ label: "Solicitações abertas", value: stats.a, icon: Inbox }, { label: "Propostas recebidas", value: stats.b, icon: Users }, { label: "Notificações", value: stats.c, icon: MessageSquare }];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="rounded-xl border bg-card p-3 lg:p-4 flex items-center gap-3">
            <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-xl lg:text-2xl font-bold leading-none">{it.value}</div>
              <div className="text-[10px] lg:text-xs text-muted-foreground mt-1 truncate">{it.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestDetail({ r, onApply, onClose }: { r: HelpRequest; onApply: () => void; onClose: () => void }) {
  const m = CATEGORY_META[r.category]; const Icon = m.icon;
  return (
    <div>
      <DrawerHeader>
        <DrawerTitle className="font-display flex items-center justify-between gap-3">
          <span className="truncate">{r.title}</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
        </DrawerTitle>
      </DrawerHeader>
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${m.tone}`}><Icon className="h-3 w-3" /> {m.label}</span>
          <span className="font-display text-2xl font-bold text-primary">{formatBRL(r.budget)}</span>
        </div>
        {r.image_urls?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {r.image_urls.map(u => <img key={u} src={u} alt="" className="h-32 rounded-lg object-cover" />)}
          </div>
        )}
        <p className="text-sm text-muted-foreground">{r.description}</p>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {r.city}{r.neighborhood ? `, ${r.neighborhood}` : ""}
        </div>
        <Button variant="hero" className="w-full" onClick={onApply}>
          <MessageSquare className="h-4 w-4" />Candidatar-se ao Help
        </Button>
      </div>
    </div>
  );
}

function OfferDetail({ o, onContact, onView, onClose }: { o: HelpOffer; onContact: () => void; onView: () => void; onClose: () => void }) {
  const m = CATEGORY_META[o.category]; const Icon = m.icon;
  const f = o.freelancer; const name = f?.display_name || f?.full_name || "Profissional";
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div>
      <DrawerHeader>
        <DrawerTitle className="font-display flex items-center justify-between gap-3">
          <span className="truncate">{o.service_name}</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
        </DrawerTitle>
      </DrawerHeader>
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {f?.avatar_url && <AvatarImage src={f.avatar_url} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{name}</div>
            {(f?.rating_avg ?? 0) > 0 && (
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" /> {f?.rating_avg?.toFixed(1)} · {f?.reviews_count} avaliações
              </div>
            )}
          </div>
          <span className="font-display text-xl font-bold text-primary">{formatBRL(o.pricing_value)}{o.pricing_type === "hour" ? "/h" : ""}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${m.tone} w-fit`}><Icon className="h-3 w-3" /> {m.label}</span>
        {o.portfolio_urls?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {o.portfolio_urls.map(u => <img key={u} src={u} alt="" className="h-32 rounded-lg object-cover" />)}
          </div>
        )}
        <p className="text-sm text-muted-foreground">{o.description}</p>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {o.city}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onView}>Ver perfil</Button>
          <Button variant="hero" className="flex-1" onClick={onContact}>Solicitar orçamento</Button>
        </div>
      </div>
    </div>
  );
}
