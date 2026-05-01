import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Review, HelpOffer, HelpRequest } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MapPin, BadgeCheck, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { OfferCard } from "@/components/OfferCard";
import { RequestCard } from "@/components/RequestCard";

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<HelpOffer[]>([]);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const [{ data: prof }, { data: revs }, { data: offs }, { data: reqs }] = await Promise.all([
        supabase.from("profiles_public").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("reviews").select("*").eq("reviewed_user_id", userId).order("created_at", { ascending: false }).limit(20),
        supabase.from("help_offers").select("*").eq("freelancer_id", userId).eq("active", true),
        supabase.from("help_requests").select("*").eq("author_id", userId).eq("status", "open").order("created_at", { ascending: false }).limit(10),
      ]);
      setProfile((prof as any) ?? null);
      const reviewerIds = Array.from(new Set(((revs as any[]) ?? []).map(r => r.reviewer_id)));
      const { data: reviewers } = reviewerIds.length
        ? await supabase.from("profiles_public").select("*").in("user_id", reviewerIds)
        : { data: [] as any[] };
      const byId = new Map((reviewers ?? []).map((p: any) => [p.user_id, p]));
      setReviews((((revs as any[]) ?? []).map(r => ({ ...r, reviewer: byId.get(r.reviewer_id) }))) as any);
      setOffers((((offs as any[]) ?? []).map(o => ({ ...o, freelancer: prof }))) as any);
      setRequests((((reqs as any[]) ?? []).map(r => ({ ...r, author: prof }))) as any);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  if (!profile) return <div className="min-h-screen grid place-items-center text-muted-foreground">Perfil não encontrado.</div>;

  const name = profile.display_name || profile.full_name;
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container h-16 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Voltar</Button>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <div className="rounded-2xl border bg-card p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24 ring-4 ring-secondary">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold">{name}</h1>
                {profile.identity_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 rounded-full px-2 py-0.5">
                    <BadgeCheck className="h-3 w-3" /> Verificado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <strong className="text-foreground">{profile.rating_avg > 0 ? profile.rating_avg.toFixed(1) : "Novo"}</strong>
                  <span>· {profile.reviews_count} avaliações</span>
                </span>
                {profile.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.city}{profile.state ? `/${profile.state}` : ""}</span>}
              </div>
              {profile.bio && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>}
            </div>
          </div>
        </div>

        {/* Métricas resumidas */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Avaliação" value={profile.rating_avg > 0 ? profile.rating_avg.toFixed(1) : "—"} />
          <Stat label="Avaliações" value={String(profile.reviews_count)} />
          <Stat label="Verificado" value={profile.identity_verified ? "Sim" : "Não"} />
        </div>

        {offers.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold mb-4">Serviços oferecidos</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {offers.map((o, i) => <OfferCard key={o.id} offer={{ ...o, freelancer: profile }} index={i} />)}
            </div>
          </section>
        )}

        {requests.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold mb-4">Solicitações abertas</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {requests.map((r, i) => <RequestCard key={r.id} request={{ ...r, author: profile }} index={i} />)}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold mb-4">Avaliações ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há avaliações. Seja o primeiro a contratar e avaliar.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => {
                const reviewerName = r.reviewer?.display_name || r.reviewer?.full_name || "Cliente";
                const initials = reviewerName.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();
                return (
                  <div key={r.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        {r.reviewer?.avatar_url && <AvatarImage src={r.reviewer.avatar_url} />}
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm flex-1">{reviewerName}</span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted"}`} />
                        ))}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    <div className="text-[10px] text-muted-foreground mt-1.5">{new Date(r.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <div className="text-lg font-bold font-display">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

