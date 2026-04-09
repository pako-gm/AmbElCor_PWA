import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ESTADOS: Record<string, string> = {
  confirmado:    "✅ Tu encargo ha sido confirmado",
  en_confeccion: "✂️ Tu traje está en confección",
  listo:         "🎉 Tu traje está listo para recoger",
  entregado:     "👗 Encargo entregado. ¡Gràcies!",
}

function formatearMensaje(nombre: string, ref: string, token: string, estado: string): string {
  const estadoTexto = ESTADOS[estado] ?? `Estado actualizado: ${estado}`
  return `Hola ${nombre} 👋

*Amb el Cor* — Actualización de tu encargo
_Mensaje automático, por favor no respondas a este número_

📋 Referencia: *${ref}*
📌 Estado Actual: ${estadoTexto}

Consulta todos los detalles de tu encargo en:
https://ambelcor.com/seguimiento/${token}

_Taller de Indumentaria Valenciana · Paiporta_`
}

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
    const { cliente_telefono, cliente_nombre, encargo_ref, token_publico, nuevo_estado } = await req.json()

    if (!cliente_telefono || !cliente_nombre || !encargo_ref || !token_publico || !nuevo_estado) {
      return new Response(JSON.stringify({ ok: false, error: "Faltan parámetros requeridos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Solo notificar en estados relevantes para la clienta
    if (!ESTADOS[nuevo_estado]) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "Estado no notificable" }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
    const authToken  = Deno.env.get("TWILIO_AUTH_TOKEN")
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886"

    if (!accountSid || !authToken) {
      return new Response(JSON.stringify({ ok: false, error: "Credenciales Twilio no configuradas" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const mensaje = formatearMensaje(cliente_nombre, encargo_ref, token_publico, nuevo_estado)

    // Normalizar teléfono: eliminar espacios y asegurar prefijo +34 si no tiene prefijo
    const telefonoLimpio = cliente_telefono.replace(/\s+/g, "").replace(/^0+/, "")
    const toNumber = telefonoLimpio.startsWith("+")
      ? `whatsapp:${telefonoLimpio}`
      : `whatsapp:+34${telefonoLimpio}`

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To:   toNumber,
          Body: mensaje,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("Twilio error:", data)
      return new Response(JSON.stringify({ ok: false, error: data.message ?? "Error Twilio" }), {
        status: 200, // devolvemos 200 para no romper el flujo del CRM
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ ok: true, sid: data.sid }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("notify-whatsapp error:", err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }
})
