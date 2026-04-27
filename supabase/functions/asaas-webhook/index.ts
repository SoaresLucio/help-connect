// ASAAS · Webhook público para atualizar status de pagamentos
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json();
    const event = body?.event as string | undefined;
    const charge = body?.payment;
    if (!event || !charge?.id) return new Response("ignored", { status: 200, headers: cors });

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pay } = await sb.from("payments").select("*").eq("asaas_payment_id", charge.id).maybeSingle();
    if (!pay) return new Response("not found", { status: 200, headers: cors });

    let newStatus = pay.status;
    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") newStatus = "escrow_held";
    if (event === "PAYMENT_REFUNDED") newStatus = "refunded";
    if (event === "PAYMENT_DELETED") newStatus = "cancelled";

    if (newStatus !== pay.status) {
      await sb.from("payments").update({ status: newStatus }).eq("id", pay.id);
      if (newStatus === "escrow_held") {
        await sb.from("notifications").insert([
          { user_id: pay.payer_id, title: "Pagamento confirmado", body: "Seu pagamento está em garantia.", type: "payment", link: `/pagamento/${pay.id}` },
          { user_id: pay.payee_id, title: "Cliente pagou em garantia", body: "Pode iniciar o serviço com tranquilidade.", type: "payment", link: `/pagamento/${pay.id}` },
        ]);
      }
    }
    return new Response("ok", { status: 200, headers: cors });
  } catch (e: any) {
    console.error(e);
    return new Response("error", { status: 200, headers: cors });
  }
});
