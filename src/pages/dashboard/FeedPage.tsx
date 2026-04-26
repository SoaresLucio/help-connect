import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Filter, MapPin, SlidersHorizontal } from "lucide-react";
import { useData } from "@/hooks/useData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { RequestCard } from "@/components/RequestCard";
import { OfferCard } from "@/components/OfferCard";
import { CATEGORIES, CATEGORY_META, formatBRL } from "@/lib/categories";
import { RequestCategory } from "@/lib/types";

export default function FeedPage() {
  const { requests, offers } = useData();
  const [params] = useSearchParams();
  const initialCat = (params.get("cat") as RequestCategory) || null;

  const [activeCats, setActiveCats] = useState<RequestCategory[]>(initialCat ? [initialCat] : []);
  const [maxBudget, setMaxBudget] = useState(3000);
  const [city, setCity] = useState("");
  const [tab, setTab] = useState<"requests" | "offers">("requests");

  const toggleCat = (c: RequestCategory) =>
    setActiveCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const filteredRequests = useMemo(() => requests.filter(r =>
    (activeCats.length === 0 || activeCats.includes(r.category)) &&
    r.budget <= maxBudget &&
    (!city || r.city.toLowerCase().includes(city.toLowerCase()) || r.neighborhood.toLowerCase().includes(city.toLowerCase()))
  ), [requests, activeCats, maxBudget, city]);

  const filteredOffers = useMemo(() => offers.filter(o =>
    (activeCats.length === 0 || activeCats.includes(o.category)) &&
    o.pricing.value <= maxBudget &&
    (!city || o.city.toLowerCase().includes(city.toLowerCase()))
  ), [offers, activeCats, maxBudget, city]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Feed inteligente</h1>
        <p className="text-muted-foreground text-sm mt-1">Encontre solicitações e profissionais filtrados pelos seus critérios.</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* FILTERS */}
        <aside className="rounded-xl border bg-card p-5 h-fit lg:sticky lg:top-24 space-y-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <h3 className="font-display font-semibold">Filtros</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Cidade ou bairro
            </label>
            <Input placeholder="Ex: São Paulo" value={city} onChange={e => setCity(e.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-muted-foreground">Orçamento máximo</span>
              <span className="font-semibold text-primary">{formatBRL(maxBudget)}</span>
            </div>
            <Slider value={[maxBudget]} onValueChange={v => setMaxBudget(v[0])} min={100} max={5000} step={100} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Categorias
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => {
                const meta = CATEGORY_META[c];
                const active = activeCats.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    className={`text-xs font-medium rounded-full px-2.5 py-1 transition-all ${
                      active ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(activeCats.length || city || maxBudget < 5000) && (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { setActiveCats([]); setCity(""); setMaxBudget(3000); }}>
              Limpar filtros
            </Button>
          )}
        </aside>

        {/* RESULTS */}
        <div>
          <Tabs value={tab} onValueChange={v => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="requests">Solicitações ({filteredRequests.length})</TabsTrigger>
              <TabsTrigger value="offers">Profissionais ({filteredOffers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-5">
              {filteredRequests.length === 0
                ? <EmptyState text="Nenhuma solicitação corresponde aos filtros." />
                : <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredRequests.map((r, i) => <RequestCard key={r.id} request={r} index={i} />)}
                  </motion.div>}
            </TabsContent>

            <TabsContent value="offers" className="mt-5">
              {filteredOffers.length === 0
                ? <EmptyState text="Nenhum profissional corresponde aos filtros." />
                : <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredOffers.map((o, i) => <OfferCard key={o.id} offer={o} index={i} />)}
                  </motion.div>}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed bg-card/50 p-12 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
