// lib/adminUsuarios.js — wrapper para invocar la Edge Function admin-usuarios
// (FASE 6/8). Centraliza la extracción del mensaje de error real, ya que
// supabase-js no expone el body JSON de una respuesta no-2xx en error.message.
import { supabase } from '@/lib/supabase'

export async function invocarAdminUsuarios(action, payload) {
  const { data, error } = await supabase.functions.invoke('admin-usuarios', { body: { action, payload } })

  if (error) {
    let mensaje = error.message
    try {
      const body = await error.context?.json()
      if (body?.error) mensaje = body.error
    } catch {
      // nos quedamos con el mensaje genérico
    }
    throw new Error(mensaje || 'Error al comunicar con el servidor')
  }
  if (data?.ok === false) throw new Error(data.error || 'Error desconocido')
  return data
}
