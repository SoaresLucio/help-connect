import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { HelpOffer } from "@/lib/types";
import { CATEGORY_META, formatBRL } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function OfferCard({ offer, index = 0 }: { offer: HelpOffer; index?: number }) {
  const meta = CATEGORY_META[offer.category];
  const Icon = meta.icon;
  const initials = offer.freelancerName.split(" ").map(s => s[0]).slice(0, 2).join("");
  const priceLabel = offer.pricing.type === "hour" ? "/h" : " fixo";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-xl border bg-gradient-card shadow-sm transition-shadow hover:shadow-elev"
    >
      <div className="bg-gradient-hero h-1.5" />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-accent/20">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-semibold truncate">{offer.freelancerName}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="font-medium text-foreground">{offer.rating.toFixed(1)}</span>
              <span>· {offer.reviews} avaliações</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.tone}`}>
            <Icon className="h-3 w-3" /> {meta.label}
          </span>
        </div>

        <h4 className="mt-4 font-display text-base font-semibold leading-tight">{offer.serviceName}</h4>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{offer.description}</p>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {offer.coverage}
          </span>
          <span className="font-display font-bold text-primary">
            {formatBRL(offer.pricing.value)}<span className="text-xs font-normal text-muted-foreground">{priceLabel}</span>
          </span>
        </div>

        <Button size="sm" variant="hero" className="w-full mt-4">Contratar</Button>
      </div>
    </motion.article>
  );
}
