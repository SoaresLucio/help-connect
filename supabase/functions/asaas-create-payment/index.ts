// ASAAS · Cria cobrança PIX em garantia (escrow)
// Recebe: { application_id, payee_id, amount_cents, description }
// Cria registro em payments e cobrança no ASAAS
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FEE_PERCENT = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const ASAAS_KEY = Deno.env.get("ASAAS_API_KEY")!;
    const ASAAS_ENV = (Deno.env.get("ASAAS_ENV") ?? "sandbox").toLowerCase();
    const ASAAS_BASE = ASAAS_ENV === "production"
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3";

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await sb.auth.getUser(jwt);
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { application_id, payee_id, amount_cents, description } = await req.json();
    if (!payee_id || !amount_cents) return json({ error: "Missing fields" }, 400);
    if (typeof amount_cents !== "number" || !Number.isFinite(amount_cents) || amount_cents < 100 || amount_cents > 100_000_000) {
      return json({ error: "Invalid amount_cents" }, 400);
    }

    // Validate amount and counterpart against the application (prevents underpayment fraud)
    if (application_id) {
      const { data: app, error: appErr } = await sb.from("applications")
        .select("proposed_price, owner_id, candidate_id")
        .eq("id", application_id).maybeSingle();
      if (appErr || !app) return json({ error: "Application not found" }, 404);
      if (app.owner_id !== user.id) return json({ error: "Only the application owner can pay" }, 403);
      if (app.candidate_id !== payee_id) return json({ error: "payee_id does not match application candidate" }, 400);
      const expectedCents = Math.round(Number(app.proposed_price ?? 0) * 100);
      if (!expectedCents || Math.abs(amount_cents - expectedCents) > 1) {
        return json({ error: "amount_cents does not match agreed price" }, 400);
      }
    }

    const fee_cents = Math.round(amount_cents * FEE_PERCENT / 100);
    const net_cents = amount_cents - fee_cents;

    // pega/cria customer ASAAS para o pagador
    const { data: payer } = await sb.from("profiles")
      .select("full_name, email, document_id, phone")
      .eq("user_id", user.id).maybeSingle();

    const customer = await asaas("/customers", "POST", ASAAS_BASE, ASAAS_KEY, {
      name: payer?.full_name || user.email,
      email: payer?.email || user.email,
      cpfCnpj: (payer?.document_id ?? "").replace(/\D/g, "") || "00000000191",
      mobilePhone: (payer?.phone ?? "").replace(/\D/g, "") || undefined,
    });

    const dueDate = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
    const charge = await asaas("/payments", "POST", ASAAS_BASE, ASAAS_KEY, {
      customer: customer.id,
      billingType: "PIX",
      value: amount_cents / 100,
      dueDate,
      description: description ?? "HelpAqui · Pagamento em garantia",
      externalReference: application_id ?? null,
    });

    let pixQr: string | null = null;
    let pixCp: string | null = null;
    try {
      const qr = await asaas(`/payments/${charge.id}/pixQrCode`, "GET", ASAAS_BASE, ASAAS_KEY);
      pixQr = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null;
      pixCp = qr.payload ?? null;
    } catch { /* opcional */ }

    const { data: payment, error } = await sb.from("payments").insert({
      application_id: application_id ?? null,
      payer_id: user.id,
      payee_id,
      amount_cents, fee_cents, net_cents,
      status: "pending",
      asaas_payment_id: charge.id,
      asaas_invoice_url: charge.invoiceUrl ?? null,
      asaas_pix_qr: pixQr,
      asaas_pix_copy_paste: pixCp,
    }).select().single();
    if (error) throw error;

    return json({ payment_id: payment.id, invoice_url: charge.invoiceUrl, pix_qr: pixQr, pix_copy_paste: pixCp });
  } catch (e: any) {
    console.error("asaas-create-payment error", e);
    return json({ error: "Internal server error. Please try again." }, 500);
  }
});

async function asaas(path: string, method: string, base: string, key: string, body?: any) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "access_token": key,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.errors?.[0]?.description || `ASAAS ${path} falhou (${res.status})`);
  return data;
}

function json(b: any, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
