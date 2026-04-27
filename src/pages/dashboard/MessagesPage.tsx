import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatThread, ChatMessage, Profile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { pushNotification } from "@/hooks/useNotifications";

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<(ChatThread & { other?: Profile })[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carrega threads
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("chat_threads").select("*")
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      const rows = (data as any[]) ?? [];
      const otherIds = Array.from(new Set(rows.map(t => t.participant_a === user.id ? t.participant_b : t.participant_a)));
      const { data: profs } = otherIds.length
        ? await supabase.from("profiles_public").select("*").in("user_id", otherIds)
        : { data: [] as any[] };
      const byId = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      const enriched = rows.map(t => ({
        ...t, other: byId.get(t.participant_a === user.id ? t.participant_b : t.participant_a),
      }));
      setThreads(enriched);
      if (!activeId && enriched[0]) setActiveId(enriched[0].id);
      setLoading(false);
    })();
  }, [user]); // eslint-disable-line

  // Carrega mensagens da thread ativa + realtime
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const { data } = await supabase.from("chat_messages").select("*")
        .eq("thread_id", activeId).order("created_at", { ascending: true });
      setMessages((data as any) ?? []);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 999999 }));
    })();

    const ch = supabase.channel(`chat:${activeId}:${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${activeId}` },
      (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }));
      }
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  const send = async () => {
    if (!user || !activeId || !text.trim()) return;
    setSending(true);
    try {
      const t = threads.find(x => x.id === activeId);
      const otherId = t?.participant_a === user.id ? t?.participant_b : t?.participant_a;
      const { error } = await supabase.from("chat_messages").insert({
        thread_id: activeId, from_user_id: user.id, text: text.trim(),
      });
      if (error) throw error;
      await supabase.from("chat_threads").update({ last_message_at: new Date().toISOString() }).eq("id", activeId);
      if (otherId) await pushNotification(otherId, "Nova mensagem", text.trim().slice(0, 80), "message", "/app/mensagens");
      setText("");
    } finally { setSending(false); }
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-7rem)] grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      <aside className="rounded-2xl border bg-card overflow-y-auto">
        <div className="p-3 border-b">
          <h2 className="font-display text-lg font-bold">Conversas</h2>
        </div>
        {threads.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">Nenhuma conversa ainda.</p>
        ) : threads.map(t => {
          const name = t.other?.display_name || t.other?.full_name || "Usuário";
          const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("");
          return (
            <button key={t.id} onClick={() => setActiveId(t.id)}
              className={cn("w-full flex items-center gap-3 p-3 hover:bg-secondary/50 text-left transition border-b",
                activeId === t.id && "bg-secondary/70")}>
              <Avatar className="h-10 w-10">
                {t.other?.avatar_url && <AvatarImage src={t.other.avatar_url} />}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{name}</div>
                <div className="text-xs text-muted-foreground truncate">{t.topic ?? "Conversa"}</div>
              </div>
            </button>
          );
        })}
      </aside>

      <section className="rounded-2xl border bg-card flex flex-col min-h-0">
        {!activeId ? (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Selecione uma conversa</div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(m => {
                const mine = m.from_user_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm")}>
                      <div className="whitespace-pre-wrap break-words">{m.text}</div>
                      <div className={cn("text-[10px] mt-1", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Comece a conversa enviando uma mensagem.</p>}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="Digite uma mensagem..."
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} />
              <Button variant="hero" onClick={send} disabled={sending || !text.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
