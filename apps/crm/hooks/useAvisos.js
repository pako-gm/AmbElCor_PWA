import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useContabilidad } from '@/hooks/useContabilidad'
import { useInventario } from '@/hooks/useInventario'
import { useConfiguracion } from '@/hooks/useConfiguracion'
import { fetchEncargos } from '@/hooks/useEncargos'
import { fetchCitas } from '@/hooks/useCitas'
import { CONFIG_KEY_NOTIFICACIONES, parsePreferencias } from '@/lib/notificaciones'

const fetchSolicitudesPassword = async () => {
  const { data, error } = await supabase
    .from('solicitudes_password')
    .select('id, email, nombre, created_at')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

const hoyISO = () => new Date().toISOString().slice(0, 10)

const nombreCliente = (c) =>
  c ? `${c.nombre ?? ''} ${c.apellidos ?? ''}`.trim() || '—' : '—'

// Agrega los avisos importantes del día reutilizando los hooks existentes.
// Devuelve grupos listos para pintar + el total y una "firma" para el punto rojo.
export function useAvisos(esGestor = false) {
  const { fetchCobros, fetchPagosProveedor } = useContabilidad()
  const { fetchAlertasStockBajo } = useInventario()
  const { fetchConfig } = useConfiguracion()
  const [grupos, setGrupos] = useState([])
  const [total, setTotal] = useState(0)
  const [firma, setFirma] = useState('')
  const [loading, setLoading] = useState(true)

  const recargar = useCallback(async () => {
    setLoading(true)
    const hoy = hoyISO()
    const mañana = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    const [cobros, pagos, stock, encargos, citas, config, solicitudes] = await Promise.all([
      fetchCobros().catch(() => []),
      fetchPagosProveedor().catch(() => []),
      fetchAlertasStockBajo().catch(() => []),
      fetchEncargos({ excludeEntregados: true }).catch(() => []),
      fetchCitas({ inicio: `${hoy}T00:00:00`, fin: `${mañana}T00:00:00` }).catch(() => []),
      fetchConfig().catch(() => ({})),
      esGestor ? fetchSolicitudesPassword().catch(() => []) : Promise.resolve([]),
    ])

    const prefs = parsePreferencias(config?.[CONFIG_KEY_NOTIFICACIONES])

    // ── Cobros pendientes / vencidos ──
    const cobrosPend = (cobros ?? []).filter(c => c.estado === 'pendiente' || c.estado === 'vencido')
    const cobrosItems = cobrosPend
      .sort((a, b) => (a.fecha_vencimiento || '9999').localeCompare(b.fecha_vencimiento || '9999'))
      .map(c => ({
        id: c.encargos?.id,
        texto: nombreCliente(c.encargos?.clientes),
        dato: parseFloat(c.importe || 0),
        vencido: c.estado === 'vencido',
        venc: c.fecha_vencimiento,
      }))

    // ── Pagos pendientes ──
    const pagosPend = (pagos ?? []).filter(p => p.estado === 'pendiente')
    const pagosItems = pagosPend.map(p => ({
      texto: p.proveedores?.nombre || p.concepto || 'Gasto',
      dato: parseFloat(p.importe || 0),
    }))

    // ── Stock bajo ──
    const stockItems = (stock ?? [])
      .sort((a, b) =>
        (parseFloat(a.stock_actual) / parseFloat(a.stock_minimo || 1)) -
        (parseFloat(b.stock_actual) / parseFloat(b.stock_minimo || 1)))
      .map(m => ({
        id: m.id,
        texto: m.nombre,
        detalle: `${parseFloat(m.stock_actual || 0)} / ${Math.ceil(parseFloat(m.stock_minimo || 0))}`,
      }))

    // ── Entregas de hoy / atrasadas ──
    const entregasPend = (encargos ?? []).filter(e => e.fecha_entrega_estimada && e.fecha_entrega_estimada <= hoy)
    const entregasItems = entregasPend
      .sort((a, b) => a.fecha_entrega_estimada.localeCompare(b.fecha_entrega_estimada))
      .map(e => ({
        id: e.id,
        texto: `${e.numero} · ${nombreCliente(e.clientes)}`,
        atrasada: e.fecha_entrega_estimada < hoy,
        detalle: e.fecha_entrega_estimada < hoy ? 'Atrasada' : 'Hoy',
      }))

    // ── Citas de hoy ──
    const citasItems = (citas ?? []).map(c => ({
      texto: c.cliente_nombre || nombreCliente(c.clientes),
      detalle: new Date(c.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    }))

    // ── Solicitudes de reset de contraseña (solo gestores) ──
    const solicitudesItems = (solicitudes ?? []).map(s => ({
      texto: s.nombre || s.email,
      detalle: 'Reset contraseña',
    }))

    const nuevosGrupos = [
      { clave: 'cobros',      titulo: 'Cobros pendientes',   icono: 'euro',    ruta: '/contabilidad?tab=cobros', items: cobrosItems, tono: 'amber' },
      { clave: 'pagos',       titulo: 'Pagos pendientes',    icono: 'wallet',  ruta: '/contabilidad?tab=pagos',  items: pagosItems,  tono: 'amber' },
      { clave: 'stock',       titulo: 'Stock bajo',          icono: 'package', ruta: '/inventario',              items: stockItems,  tono: 'red'   },
      { clave: 'entregas',    titulo: 'Entregas',            icono: 'truck',   ruta: '/encargos',                items: entregasItems, tono: 'violet' },
      { clave: 'citas',       titulo: 'Citas de hoy',        icono: 'calendar',ruta: '/citas',                   items: citasItems,  tono: 'green' },
      { clave: 'solicitudes', titulo: 'Solicitudes de acceso', icono: 'user', ruta: '/ajustes?seccion=usuarios', items: solicitudesItems, tono: 'violet' },
    ].filter(g => prefs[g.clave] !== false && g.items.length > 0)

    const totalAvisos = nuevosGrupos.reduce((s, g) => s + g.items.length, 0)
    const nuevaFirma = nuevosGrupos.map(g => `${g.clave}:${g.items.length}`).join('|') + `|${hoy}`

    setGrupos(nuevosGrupos)
    setTotal(totalAvisos)
    setFirma(totalAvisos > 0 ? nuevaFirma : '')
    setLoading(false)
  }, [fetchCobros, fetchPagosProveedor, fetchAlertasStockBajo, fetchConfig, esGestor])

  return { loading, grupos, total, firma, recargar }
}
