import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Check } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function NotificationsPopover({ children }: { children: ReactNode }) {
  const { items, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-display font-semibold text-sm">Notificações</span>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllRead}>
              <Check className="h-3 w-3" /> Marcar lidas
            </Button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma notificação ainda.</div>
          ) : items.map(n => (
            <button
              key={n.id}
              onClick={() => n.link && navigate(n.link)}
              className={`w-full text-left p-3 border-b hover:bg-secondary/50 transition-colors ${!n.read ? "bg-accent/5" : ""}`}
            >
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
