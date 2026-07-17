import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const BUZON_CENTRAL = "ambelcorvalencia@gmail.com"
const REMITENTE = "onboarding@resend.dev"

const ORIGENES_PERMITIDOS = [
  "https://ambelcorpwa.vercel.app",
  "http://localhost:5173",
]

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ORIGENES_PERMITIDOS.includes(origin) ? origin : ORIGENES_PERMITIDOS[0]
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  })
}

async function captchaValido(token: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")
  // Sin secreto configurado: no se puede verificar, se deja pasar (paso
  // manual pendiente documentado en docs/setup-usuarios.md).
  if (!secret) return true
  if (!token) return false

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = await resp.json()
  return data?.success === true
}

serve(async (req) => {
  const origin = req.headers.get("origin")

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) })
  }

  try {
    const { email, captchaToken } = await req.json()

    if (!email) {
      return jsonResponse({ ok: false, error: "Falta email" }, 400, origin)
    }

    if (!(await captchaValido(captchaToken))) {
      return jsonResponse({ ok: false, error: "captcha" }, 400, origin)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // No-op silencioso si el email no existe o si ya se superó el
    // límite de solicitudes por hora (ver 04_solicitudes_password.sql).
    await supabaseAdmin.rpc("solicitar_reset_password", { p_email: email })

    const resendApiKey = Deno.env.get("RESEND_API_KEY")

    // Sin API key configurada: fallo silencioso. El aviso en la campana
    // de notificaciones (FASE 5, useAvisos + NotificacionesBell) es la
    // garantía real; este email es solo una comodidad adicional.
    if (!resendApiKey) {
      return jsonResponse({ ok: true, skipped: true, reason: "RESEND_API_KEY no configurada" }, 200, origin)
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
      // No rompe el flujo del CRM: el registro en solicitudes_password ya se hizo.
      return jsonResponse({ ok: true, emailEnviado: false }, 200, origin)
    }

    return jsonResponse({ ok: true, id: data.id }, 200, origin)

  } catch (err) {
    console.error("notificar-reset error:", err)
    return jsonResponse({ ok: false, error: String(err) }, 500, origin)
  }
})
