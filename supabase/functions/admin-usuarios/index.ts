import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const ORIGENES_PERMITIDOS = [
  "https://ambelcorpwa.vercel.app",
  "http://localhost:5173",
]

const ROLES_VALIDOS = ["propietaria", "costurera", "administrador"]
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 carácter especial.
function passwordValida(password: unknown): password is string {
  return typeof password === "string" &&
    password.length >= 8 &&
    /[A-ZÁÉÍÓÚÑ]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
}

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

serve(async (req) => {
  const origin = req.headers.get("origin")

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const admin = createClient(supabaseUrl, serviceRoleKey)

  try {
    // ── Autenticación de la llamada ──────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? ""
    const jwt = authHeader.replace(/^Bearer\s+/i, "")
    if (!jwt) {
      return jsonResponse({ ok: false, error: "Falta token de autenticación" }, 401, origin)
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) {
      return jsonResponse({ ok: false, error: "Token inválido" }, 401, origin)
    }
    const llamante = userData.user

    const { data: perfilLlamante, error: perfilErr } = await admin
      .from("perfiles")
      .select("rol, nombre, activo")
      .eq("id", llamante.id)
      .maybeSingle()

    if (perfilErr || !perfilLlamante || !perfilLlamante.activo ||
        !["propietaria", "administrador"].includes(perfilLlamante.rol)) {
      return jsonResponse({ ok: false, error: "No autorizado" }, 403, origin)
    }

    const { action, payload } = await req.json()

    // ── crear_usuario ────────────────────────────────────────────
    if (action === "crear_usuario") {
      const { email, password, nombre, rol, accent } = payload ?? {}
      if (!email || !EMAIL_REGEX.test(email)) {
        return jsonResponse({ ok: false, error: "Email no válido" }, 400, origin)
      }
      if (!passwordValida(password)) {
        return jsonResponse({ ok: false, error: "La contraseña debe tener mínimo 8 caracteres, con una mayúscula, un número y un carácter especial" }, 400, origin)
      }
      if (!nombre) {
        return jsonResponse({ ok: false, error: "Falta el nombre" }, 400, origin)
      }
      if (!ROLES_VALIDOS.includes(rol)) {
        return jsonResponse({ ok: false, error: "Rol no válido" }, 400, origin)
      }

      const { data: creado, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createErr || !creado?.user) {
        return jsonResponse({ ok: false, error: createErr?.message ?? "No se pudo crear el usuario" }, 400, origin)
      }

      const { error: insertErr } = await admin.from("perfiles").insert({
        id: creado.user.id,
        nombre,
        email,
        rol,
        accent: accent ?? "salvia",
      })
      if (insertErr) {
        // Revertir el alta en Auth si falla el perfil, para no dejar usuarios huérfanos.
        await admin.auth.admin.deleteUser(creado.user.id)
        return jsonResponse({ ok: false, error: insertErr.message }, 400, origin)
      }

      return jsonResponse({ ok: true, user_id: creado.user.id }, 200, origin)
    }

    // ── reset_password ───────────────────────────────────────────
    if (action === "reset_password") {
      const { user_id, nueva_password } = payload ?? {}
      if (!user_id || !passwordValida(nueva_password)) {
        return jsonResponse({ ok: false, error: "La contraseña debe tener mínimo 8 caracteres, con una mayúscula, un número y un carácter especial" }, 400, origin)
      }

      const { error: updateErr } = await admin.auth.admin.updateUserById(user_id, { password: nueva_password })
      if (updateErr) {
        return jsonResponse({ ok: false, error: updateErr.message }, 400, origin)
      }

      const { data: perfilObjetivo } = await admin
        .from("perfiles")
        .select("email")
        .eq("id", user_id)
        .maybeSingle()

      if (perfilObjetivo?.email) {
        await admin
          .from("solicitudes_password")
          .update({
            estado: "resuelta",
            resuelta_at: new Date().toISOString(),
            resuelta_por: perfilLlamante.nombre,
          })
          .eq("email", perfilObjetivo.email)
          .eq("estado", "pendiente")
      }

      return jsonResponse({ ok: true }, 200, origin)
    }

    // ── toggle_activo ────────────────────────────────────────────
    if (action === "toggle_activo") {
      const { user_id, activo } = payload ?? {}
      if (!user_id || typeof activo !== "boolean") {
        return jsonResponse({ ok: false, error: "Datos incompletos" }, 400, origin)
      }
      const { error: updateErr } = await admin.from("perfiles").update({ activo }).eq("id", user_id)
      if (updateErr) {
        return jsonResponse({ ok: false, error: updateErr.message }, 400, origin)
      }
      return jsonResponse({ ok: true }, 200, origin)
    }

    // ── cambiar_rol ───────────────────────────────────────────────
    if (action === "cambiar_rol") {
      const { user_id, rol } = payload ?? {}
      if (!user_id || !ROLES_VALIDOS.includes(rol)) {
        return jsonResponse({ ok: false, error: "Datos incompletos o rol no válido" }, 400, origin)
      }
      const { error: updateErr } = await admin.from("perfiles").update({ rol }).eq("id", user_id)
      if (updateErr) {
        return jsonResponse({ ok: false, error: updateErr.message }, 400, origin)
      }
      return jsonResponse({ ok: true }, 200, origin)
    }

    return jsonResponse({ ok: false, error: "Acción no reconocida" }, 400, origin)

  } catch (err) {
    console.error("admin-usuarios error:", err)
    return jsonResponse({ ok: false, error: String(err) }, 500, origin)
  }
})
