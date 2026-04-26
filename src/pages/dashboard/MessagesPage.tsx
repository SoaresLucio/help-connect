import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { useData } from "@/hooks/useData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { threads, messages, sendMessage } = useData();
  const [activeId, setActiveId] = useState<string>(threads[0]?.id || "");
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = threads.find(t => t.id === activeId);
  const list = messages[activeId] || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [list.length, activeId]);

  const send = () => {
    if (!text.trim() || !activeId) return;
    sendMessage(activeId, text.trim());
    setText("");
  };

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Mensagens</h1>
        <p className="text-muted-foreground text-sm mt-1">Negocie diretamente com profissionais e clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* THREADS */}
        <aside className="rounded-xl border bg-card overflow-y-auto">
          {threads.map(t => {
            const active = activeId === t.id;
            const initials = t.participantName.split(" ").map(s => s[0]).slice(0, 2).join("");
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "w-full text-left p-3 flex items-center gap-3 border-b last:border-b-0 transition-colors",
                  active ? "bg-accent-soft" : "hover:bg-secondary/40"
                )}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{t.participantName}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.topic}</div>
                </div>
                {active && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
              </button>
            );
          })}
        </aside>

        {/* CHAT */}
        <section className="rounded-xl border bg-card flex flex-col overflow-hidden">
          {active ? (
            <>
              <header className="border-b p-4 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {active.participantName.split(" ").map(s => s[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{active.participantName}</div>
                  <div className="text-[11px] text-muted-foreground">{active.topic}</div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-2 bg-gradient-soft">
                <AnimatePresence initial={false}>
                  {list.map(m => {
                    const mine = m.fromId === "me";
                    return (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border rounded-bl-sm"
                        )}>
                          {m.text}
                          <div className={cn("text-[10px] mt-1", mine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                            {new Date(m.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <form
                onSubmit={e => { e.preventDefault(); send(); }}
                className="border-t p-3 flex gap-2"
              >
                <Input placeholder="Digite sua mensagem..." value={text} onChange={e => setText(e.target.value)} />
                <Button type="submit" variant="hero" size="icon"><Send className="h-4 w-4" /></Button>
              </form>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
              Selecione uma conversa para começar
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
