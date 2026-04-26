import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { HelpRequest, HelpOffer } from "@/lib/types";
import { CATEGORIES, CATEGORY_META, formatBRL } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { OfferCard } from "@/components/OfferCard";
import { RequestCard } from "@/components/RequestCard";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { haversineKm, getBrowserLocation, getStoredLocation, saveStoredLocation } from "@/lib/geo";
import { ContactProfessionalDialog } from "@/components/ContactProfessionalDialog";
import { ApplyToRequestDialog } from "@/components/ApplyToRequestDialog";
import { useNavigate } from "react-router-dom";

export default function FeedPage() {
  const { activeRole } = useAuth();
  const navigate = useNavigate();
  const isFreelancer = activeRole === "freelancer";

  const [offers, setOffers] = useState<HelpOffer[]>([]);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [radiusKm, setRadiusKm] = useState(50);
  const [useGeo, setUseGeo] = useState(false);
  const [geo, setGeo] = useState<{ latitude: number; longitude: number } | null>(getStoredLocation());

  const [contactOffer, setContactOffer] = useState<HelpOffer | null>(null);
  const [applyRequest, setApplyRequest] = useState<HelpRequest | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (isFreelancer) {
        const { data } = await supabase
          .from("help_requests")
          .select("*, author:profiles!help_requests_author_id_fkey(*)")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(60);
        setRequests((data as any) ?? []);
      } else {
        const { data } = await supabase
          .from("help_offers")
          .select("*, freelancer:profiles!help_offers_freelancer_id_fkey(*)")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(60);
        setOffers((data as any) ?? []);
      }
      setLoading(false);
    })();
  }, [isFreelancer]);

  const enableGeo = async () => {
    try {
      const pos = await getBrowserLocation();
      setGeo(pos); saveStoredLocation(pos); setUseGeo(true);
    } catch { /* ignore */ }
  };

  const filteredOffers = useMemo(() => {
    let arr = offers.filter(o =>
      (!cat || o.category === cat) &&
      (!city || o.city.toLowerCase().includes(city.toLowerCase())) &&
      (!search || `${o.service_name} ${o.description}`.toLowerCase().includes(search.toLowerCase()))
    );
    if (useGeo && geo) {
      arr = arr.map(o => o.latitude && o.longitude
        ? { ...o, distance_km: haversineKm(geo, { latitude: o.latitude, longitude: o.longitude }) }
        : { ...o, distance_km: undefined }
      ).filter(o => o.distance_km == null || o.distance_km <= radiusKm)
       .sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
    }
    return arr;
  }, [offers, cat, city, search, useGeo, geo, radiusKm]);

  const filteredRequests = useMemo(() => {
    let arr = requests.filter(r =>
      (!cat || r.category === cat) &&
      (!city || r.city.toLowerCase().includes(city.toLowerCase())) &&
      (!search || `${r.title} ${r.description}`.toLowerCase().includes(search.toLowerCase()))
    );
    if (useGeo && geo) {
      arr = arr.map(r => r.latitude && r.longitude
        ? { ...r, distance_km: haversineKm(geo, { latitude: r.latitude, longitude: r.longitude }) }
        : { ...r, distance_km: undefined }
      ).filter(r => r.distance_km == null || r.distance_km <= radiusKm)
       .sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
    }
    return arr;
  }, [requests, cat, city, search, useGeo, geo, radiusKm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{isFreelancer ? "Demandas abertas" : "Profissionais disponíveis"}</h1>
        <p className="text-muted-foreground mt-1">
          {isFreelancer ? "Encontre solicitações de help próximas e envie sua proposta." : "Encontre profissionais verificados na sua região."}
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-4 lg:p-5 space-y-4">
        <div className="grid lg:grid-cols-[1fr_240px_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Filtrar por cidade" className="pl-9" />
          </div>
          <Button variant={useGeo ? "navy" : "outline"} onClick={() => geo ? setUseGeo(v => !v) : enableGeo()}>
            <MapPin className="h-4 w-4" /> {useGeo ? "Próximos de mim" : "Usar minha localização"}
          </Button>
        </div>

        {useGeo && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Raio: {radiusKm} km</span>
            <Slider value={[radiusKm]} onValueChange={v => setRadiusKm(v[0])} min={1} max={200} step={1} className="flex-1" />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCat(null)} className={`text-xs px-3 py-1.5 rounded-full border transition ${!cat ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/30"}`}>Todas</button>
          {CATEGORIES.map(c => {
            const m = CATEGORY_META[c];
            const Icon = m.icon;
            const active = cat === c;
            return (
              <button key={c} onClick={() => setCat(c)} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/30"}`}>
                <Icon className="h-3 w-3" /> {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : isFreelancer ? (
        filteredRequests.length === 0 ? (
          <EmptyState text="Nenhuma demanda corresponde aos filtros." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRequests.map((r, i) => <RequestCard key={r.id} request={r} index={i} onApply={setApplyRequest} />)}
          </div>
        )
      ) : (
        filteredOffers.length === 0 ? (
          <EmptyState text="Nenhum profissional corresponde aos filtros." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOffers.map((o, i) => (
              <OfferCard key={o.id} offer={o} index={i}
                onContact={setContactOffer}
                onView={() => navigate(`/u/${o.freelancer_id}`)}
              />
            ))}
          </div>
        )
      )}

      <ContactProfessionalDialog offer={contactOffer} onClose={() => setContactOffer(null)} />
      <ApplyToRequestDialog request={applyRequest} onClose={() => setApplyRequest(null)} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <X className="h-8 w-8 mx-auto text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
