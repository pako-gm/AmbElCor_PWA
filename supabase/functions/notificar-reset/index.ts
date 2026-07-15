import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BUZON_CENTRAL = "ambelcorvalencia@gmail.com"
const REMITENTE = "onboarding@resend.dev"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "Falta email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY")

    // Sin API key configurada: fallo silencioso. El aviso en la campana
    // de notificaciones (FASE 5, useAvisos + NotificacionesBell) es la
    // garantía real; este email es solo una comodidad adicional.
    if (!resendApiKey) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "RESEND_API_KEY no configurada" }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: BUZON_CENTRAL,
        subject: "AmbElCor CRM · Solicitud de restablecimiento de contraseña",
        text: `Se ha solicitado restablecer la contraseña de la cuenta: ${email}\n\nGestiona la solicitud desde Ajustes → Usuarios en el CRM.`,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Resend error:", data)
      return new Response(JSON.stringify({ ok: false, error: data.message ?? "Error Resend" }), {
        status: 200, // no rompe el flujo del CRM
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("notificar-reset error:", err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }
})
