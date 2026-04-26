import { motion } from "framer-motion";
import { Calendar, MapPin, MessageSquare, Users } from "lucide-react";
import { HelpRequest } from "@/lib/types";
import { CATEGORY_META, formatBRL } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function RequestCard({ request, index = 0 }: { request: HelpRequest; index?: number }) {
  const meta = CATEGORY_META[request.category];
  const Icon = meta.icon;
  const initials = request.authorName.split(" ").map(s => s[0]).slice(0, 2).join("");
  const date = new Date(request.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col rounded-xl border bg-gradient-card p-5 shadow-sm transition-shadow hover:shadow-elev"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.tone}`}>
          <Icon className="h-3.5 w-3.5" /> {meta.label}
        </span>
        <span className="font-display text-lg font-bold text-primary">{formatBRL(request.budget)}</span>
      </div>

      <h3 className="mt-3 font-display text-base font-semibold leading-tight text-foreground line-clamp-2">
        {request.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{request.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {request.neighborhood}</span>
        <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {date}</span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-xs font-medium">{request.authorName}</div>
            <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> {request.proposalsCount} propostas
            </div>
          </div>
        </div>
        <Button size="sm" variant="navy" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageSquare className="h-3.5 w-3.5" /> Enviar
        </Button>
      </div>
    </motion.article>
  );
}
