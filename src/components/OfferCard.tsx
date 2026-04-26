import { motion } from "framer-motion";
import { Star, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORY_META, formatBRL } from "@/lib/categories";
import { HelpOffer } from "@/lib/types";
import { formatDistance } from "@/lib/geo";

interface Props {
  offer: HelpOffer;
  index?: number;
  onContact?: (o: HelpOffer) => void;
  onView?: (o: HelpOffer) => void;
}

export function OfferCard({ offer, index = 0, onContact, onView }: Props) {
  const meta = CATEGORY_META[offer.category];
  const Icon = meta.icon;
  const f = offer.freelancer;
  const name = f?.display_name || f?.full_name || "Profissional";
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const rating = f?.rating_avg ?? 0;
  const reviews = f?.reviews_count ?? 0;
  const priceLabel = `${formatBRL(offer.pricing_value)}${offer.pricing_type === "hour" ? "/h" : ""}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group rounded-2xl border bg-card p-5 hover:shadow-elev hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-secondary">
          {f?.avatar_url ? <AvatarImage src={f.avatar_url} alt={name} /> : null}
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold leading-tight truncate">{name}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="font-medium text-foreground">{rating > 0 ? rating.toFixed(1) : "Novo"}</span>
            {reviews > 0 && <span>· {reviews} avaliações</span>}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
      </div>

      <h4 className="mt-4 font-display text-base font-semibold line-clamp-1">{offer.service_name}</h4>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{offer.description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {offer.city}</span>
        {offer.distance_km != null && <span className="inline-flex items-center gap-1 text-primary"><MapPin className="h-3 w-3" />{formatDistance(offer.distance_km)}</span>}
        {offer.coverage && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {offer.coverage}</span>}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">A partir de</div>
          <div className="font-display text-lg font-bold text-primary">{priceLabel}</div>
        </div>
        <div className="flex gap-2">
          {onView && <Button size="sm" variant="outline" onClick={() => onView(offer)}>Perfil</Button>}
          {onContact && <Button size="sm" variant="navy" onClick={() => onContact(offer)}>Contratar</Button>}
        </div>
      </div>
    </motion.article>
  );
}
