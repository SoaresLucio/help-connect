import { motion } from "framer-motion";
import { MapPin, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORY_META, formatBRL } from "@/lib/categories";
import { HelpRequest } from "@/lib/types";
import { formatDistance } from "@/lib/geo";

interface Props {
  request: HelpRequest;
  index?: number;
  onApply?: (r: HelpRequest) => void;
}

export function RequestCard({ request, index = 0, onApply }: Props) {
  const meta = CATEGORY_META[request.category];
  const Icon = meta.icon;
  const author = request.author;
  const name = author?.display_name || author?.full_name || "Solicitante";
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const when = request.scheduled_at ? new Date(request.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Data flexível";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group rounded-2xl border bg-card overflow-hidden hover:shadow-elev hover:-translate-y-0.5 transition-all"
    >
      {request.image_urls?.[0] && (
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          <img src={request.image_urls[0]} alt={request.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}>
            <Icon className="h-3 w-3" /> {meta.label}
          </span>
          <span className="font-display text-xl font-bold text-primary">{formatBRL(request.budget)}</span>
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2">{request.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{request.description}</p>

        <div className="mt-4 flex items-center gap-2">
          <Avatar className="h-7 w-7">
            {author?.avatar_url ? <AvatarImage src={author.avatar_url} /> : null}
            <AvatarFallback className="bg-secondary text-foreground text-[10px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium truncate flex-1">{name}</span>
          <span className="text-[10px] text-muted-foreground">{request.proposals_count} propostas</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {request.city}{request.neighborhood ? `, ${request.neighborhood}` : ""}</span>
          {request.distance_km != null && <span className="inline-flex items-center gap-1 text-primary">{formatDistance(request.distance_km)}</span>}
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {when}</span>
        </div>

        {onApply && (
          <Button size="sm" variant="hero" className="w-full mt-4" onClick={() => onApply(request)}>
            <MessageSquare className="h-4 w-4" /> Enviar proposta
          </Button>
        )}
      </div>
    </motion.article>
  );
}
