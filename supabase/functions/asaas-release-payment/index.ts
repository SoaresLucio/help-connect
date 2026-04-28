// ASAAS · Confirma finalização e libera escrow para o profissional
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace("Bearer ", "");
    const { data: { user } } = await sb.auth.getUser(jwt);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { payment_id } = await req.json();
    const { data: payment, error } = await sb.from("payments").select("*").eq("id", payment_id).maybeSingle();
    if (error || !payment) return json({ error: "Payment not found" }, 404);
    if (payment.payer_id !== user.id) return json({ error: "Forbidden" }, 403);

    if (payment.status !== "escrow_held") {
      return json({ error: "Payment must be in escrow before it can be released" }, 400);
    }

    await sb.from("payments").update({
      status: "released",
      released_at: new Date().toISOString(),
    }).eq("id", payment.id);

    if (payment.application_id) {
      await sb.from("applications").update({ status: "completed" }).eq("id", payment.application_id);
    }

    await sb.from("notifications").insert([
      { user_id: payment.payee_id, title: "Pagamento liberado!", body: "O cliente confirmou a finalização. Seu valor foi liberado.", type: "payment", link: `/pagamento/${payment.id}` },
      { user_id: payment.payer_id, title: "Você liberou o pagamento", body: "Obrigado por usar a HelpAqui!", type: "payment", link: `/pagamento/${payment.id}` },
    ]);

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e.message ?? String(e) }, 500);
  }
});

function json(b: any, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
