import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Euro } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { Icon, Btn } from '@/components/inventario/InventarioUI'
import { MovementModal, LineEditModal, EditMovimientoModal, ConfirmEliminarMovimientoModal, ConfirmDesactivarModal } from '@/components/inventario/InventarioModals'
import { useInventario } from '@/hooks/useInventario'
import { useToast } from '@/hooks/useToast'
import { formatImporte, formatCantidad } from '@/utils/formatters'

const UNIT_DISPLAY = {
  unidad: 'ud.', metro: 'm', metro_cuadrado: 'm²', kilogramo: 'kg',
  litro: 'l', par: 'par', rollo: 'rollo', caja: 'caja',
}

function fmtDate(s) {
  if (!s) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s))
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s
}

export default function MaterialDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    fetchMaterial, actualizarMaterial, desactivarMaterial,
    registrarEntrada, registrarSalida, registrarAjuste,
    actualizarMovimiento, eliminarMovimiento,
    fetchProveedores, fetchEncargosActivos, fetchCategorias, fetchUnidades,
  } = useInventario()

  const [material, setMaterial] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [prendaVinculada, setPrendaVinculada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [proveedores, setProveedores] = useState([])
  const [encargos, setEncargos] = useState([])
  const [categoriasDB, setCategoriasDB] = useState([])
  const [unidadesDB, setUnidadesDB] = useState([])
  const [modal, setModal] = useState(null) // null | 'entrada' | 'salida' | 'ajuste' | 'editar' | 'desactivar' | 'editarMov' | 'borrarMov'
  const [movSeleccionado, setMovSeleccionado] = useState(null)
  const toast = useToast()

  const cargar = async () => {
    setLoading(true)
    const { material: m, movimientos: movs, prendaVinculada: pv } = await fetchMaterial(id)
    setMaterial(m)
    setMovimientos(movs)
    setPrendaVinculada(pv)
    setLoading(false)
  }

  const handlePonerEnVenta = () => {
    if (prendaVinculada) {
      navigate(`/catalogo/${prendaVinculada.id}`)
    } else {
      navigate('/catalogo/nueva', {
        state: {
          material: { id: material.id, nombre: material.nombre },
          draftPrenda: { nombre: material.nombre, tipo_uso: 'solo_venta' },
        },
      })
    }
  }

  useEffect(() => {
    cargar()
    fetchProveedores().then(setProveedores)
    fetchEncargosActivos().then(setEncargos)
    fetchCategorias().then(setCategoriasDB)
    fetchUnidades().then(setUnidadesDB)
  }, [id])

  const showToast = (msg) => toast.success(msg)

  const handleMovimiento = async ({ kind, materialId, qty, costeUd, proveedorId, encargo, motivo, referencia }) => {
    if (kind === 'entrada') {
      await registrarEntrada({
        materialId,
        materialNombre: material.nombre,
        cantidad: Math.abs(qty),
        precioUnitario: costeUd || null,
        proveedorId: proveedorId || null,
        fecha: new Date().toISOString().slice(0, 10),
        notas: referencia || null,
        crearGasto: !!proveedorId,
      })
      showToast('Entrada registrada.')
    } else if (kind === 'salida') {
      const encargoObj = encargos.find(e => {
        const label = `${e.numero} — ${e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : ''}`
        return label === encargo
      })
      await registrarSalida({
        materialId,
        cantidad: Math.abs(qty),
        encargoId: encargoObj?.id || null,
        motivo: 'consumo_encargo',
        fecha: new Date().toISOString().slice(0, 10),
        notas: referencia || null,
      })
      showToast('Salida registrada.')
    } else if (kind === 'ajuste') {
      await registrarAjuste({
        materialId,
        cantidad: qty,
        motivo: motivo || referencia || 'Ajuste manual',
        fecha: new Date().toISOString().slice(0, 10),
      })
      showToast('Ajuste registrado.')
    }
    await cargar()
  }

  const handleEditar = async (campos) => {
    await actualizarMaterial(id, campos)
    showToast('Material actualizado.')
    await cargar()
  }

  const handleDesactivar = async () => {
    await desactivarMaterial(id)
    navigate('/inventario')
  }

  const handleEliminarMovimiento = async () => {
    await eliminarMovimiento(movSeleccionado.id)
    showToast('Movimiento eliminado.')
    setModal(null)
    setMovSeleccionado(null)
    await cargar()
  }

  const handleEditarMovimiento = async (datos) => {
    await actualizarMovimiento(movSeleccionado.id, datos)
    showToast('Movimiento actualizado.')
    await cargar()
  }

  const handleActivar = async () => {
    await actualizarMaterial(id, { activo: true })
    showToast('Material reactivado.')
    await cargar()
  }

  if (loading) return (
    <PageWrapper>
      <div className="text-center py-[60px] text-muted">Cargando…</div>
    </PageWrapper>
  )

  if (!material) return (
    <PageWrapper>
      <div className="text-center py-[60px] text-muted">Material no encontrado.</div>
    </PageWrapper>
  )

  const stock = parseFloat(material.stock_actual || 0)
  const minimo = parseFloat(material.stock_minimo || 0)
  const stockBajo = stock < minimo && minimo > 0
  const unit = UNIT_DISPLAY[material.unidad] || material.unidad || 'ud.'

  // Adaptar proveedores y encargos para MovementModal
  const proveedoresAdapt = proveedores.map(p => ({ id: p.id, nombre: p.nombre }))
  const encargosAdapt = encargos.map(e => ({
    id: e.id,
    label: `${e.numero} — ${e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : ''}`
  }))

  return (
    <PageWrapper>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* Backlink */}
        <button className="backlink" onClick={() => navigate('/inventario')}>
          <Icon name="back" size={15} />
          Inventario
        </button>

        {/* Cabecera detalle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.04em' }}>
              {material.codigo}
              {material.categoria && ` · ${material.categoria}`}
              {material.tipo === 'producto_reventa' && ' · PRODUCTO DE REVENTA'}
            </p>
            <h1 style={{ fontFamily: '"Lora", serif', fontSize: 38, fontWeight: 600, margin: '6px 0 4px', letterSpacing: '-.01em', color: 'var(--ink)', lineHeight: 1.1 }}>
              {material.nombre}
            </h1>
            {material.descripcion && (
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 15 }}>{material.descripcion}</p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <b style={{
              display: 'block',
              fontSize: 48, fontWeight: 800,
              color: stockBajo ? 'var(--danger)' : 'var(--brand-deep)',
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {formatCantidad(stock)}
            </b>
            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{unit} en stock</span>
            {material.tipo === 'producto_reventa' && (
              <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                Coste actual (PMP): <b style={{ color: 'var(--ink)' }}>{formatImporte(material.precio_referencia)}</b>/{unit}
              </span>
            )}
            {stockBajo && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--danger)', fontWeight: 700, marginTop: 4 }}>
                <Icon name="warn" size={13} /> Stock bajo (mín. {minimo})
              </span>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {material.activo && <>
              <Btn kind="ent" icon="arrowDown" onClick={() => setModal('entrada')}>Entrada</Btn>
              <Btn kind="sal" icon="arrowUp" onClick={() => setModal('salida')}>Salida</Btn>
              <Btn kind="aju" icon="wrench" onClick={() => setModal('ajuste')}>Ajuste</Btn>
            </>}
            <Btn kind="edi" icon="pencil" onClick={() => setModal('editar')}>Editar</Btn>
            {material.tipo === 'producto_reventa' && (
              <button type="button" className="btn btn--brand" onClick={handlePonerEnVenta}>
                <Euro size={16} />
                <span>Poner en venta</span>
              </button>
            )}
          </div>
          {material.activo
            ? <Btn kind="danger-ghost" icon="power" onClick={() => setModal('desactivar')}>Desactivar</Btn>
            : <Btn kind="brand" icon="power" onClick={handleActivar}>Activar</Btn>
          }
        </div>

        {/* Historial de movimientos */}
        <div style={{ marginTop: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: '"Lora", serif', fontSize: 23, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
              Historial de movimientos
            </h2>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
              {movimientos.length} {movimientos.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
          </div>

          <div style={{ marginTop: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '6px 20px', boxShadow: 'var(--shadow)' }}>
            {movimientos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 20px', fontSize: 14.5 }}>
                Sin movimientos registrados.
              </div>
            ) : movimientos.map((mv) => {
              const qty = parseFloat(mv.cantidad || 0)
              const pos = mv.tipo === 'entrada' || (mv.tipo === 'ajuste' && qty > 0)
              const esDeVenta = !!mv.ventas
              return (
                <div key={mv.id} className="mov" style={{ padding: '13px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--faint)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtDate(mv.fecha)}
                    </span>
                    <span style={{ fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mv.ventas ? (
                        <button
                          onClick={() => navigate(`/ventas/${mv.ventas.id}`)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--brand-deep)', fontWeight: 600, font: 'inherit' }}
                        >
                          Venta {mv.ventas.numero}
                        </button>
                      ) : (
                        mv.proveedores?.nombre || mv.encargos?.numero || mv.motivo || '—'
                      )}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      {mv.notas || mv.motivo || ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span className={`mov__tag mov__tag--${mv.tipo}`}>{mv.tipo}</span>
                    <span className={`mov__qty ${pos ? 'mov__qty--pos' : 'mov__qty--neg'}`}>
                      {pos ? '+' : '−'}{formatCantidad(Math.abs(qty))} {unit}
                    </span>
                    {mv.precio_unitario && (
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatImporte(mv.precio_unitario)}/ud.
                      </span>
                    )}
                    <button
                      title={esDeVenta ? 'Esta salida pertenece a una venta: edítala desde Ventas' : 'Editar movimiento'}
                      aria-label="Editar movimiento"
                      disabled={esDeVenta}
                      onClick={() => { if (!esDeVenta) { setMovSeleccionado(mv); setModal('editarMov') } }}
                      style={{ background: 'none', border: 'none', cursor: esDeVenta ? 'not-allowed' : 'pointer', color: 'var(--muted)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', opacity: esDeVenta ? 0.25 : 0.6 }}
                      onMouseEnter={e => { if (!esDeVenta) e.currentTarget.style.opacity = 1 }}
                      onMouseLeave={e => { if (!esDeVenta) e.currentTarget.style.opacity = 0.6 }}
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      title={esDeVenta ? 'Esta salida pertenece a una venta: elimínala desde Ventas' : 'Eliminar movimiento'}
                      aria-label="Eliminar movimiento"
                      disabled={esDeVenta}
                      onClick={() => { if (!esDeVenta) { setMovSeleccionado(mv); setModal('borrarMov') } }}
                      style={{ background: 'none', border: 'none', cursor: esDeVenta ? 'not-allowed' : 'pointer', color: 'var(--danger)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', opacity: esDeVenta ? 0.25 : 0.5 }}
                      onMouseEnter={e => { if (!esDeVenta) e.currentTarget.style.opacity = 1 }}
                      onMouseLeave={e => { if (!esDeVenta) e.currentTarget.style.opacity = 0.5 }}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modales */}
      {(modal === 'entrada' || modal === 'salida' || modal === 'ajuste') && (
        <MovementModal
          type={modal}
          materiales={[material]}
          proveedores={proveedoresAdapt}
          encargos={encargosAdapt}
          initialId={material.id}
          onClose={() => setModal(null)}
          onConfirm={handleMovimiento}
        />
      )}

      {modal === 'borrarMov' && movSeleccionado && (
        <ConfirmEliminarMovimientoModal
          movimiento={movSeleccionado}
          unit={unit}
          onClose={() => { setModal(null); setMovSeleccionado(null) }}
          onConfirm={handleEliminarMovimiento}
        />
      )}

      {modal === 'editarMov' && movSeleccionado && (
        <EditMovimientoModal
          movimiento={movSeleccionado}
          unit={unit}
          onClose={() => { setModal(null); setMovSeleccionado(null) }}
          onSave={handleEditarMovimiento}
        />
      )}

      {modal === 'editar' && (
        <LineEditModal
          material={material}
          categorias={categoriasDB.map(c => c.nombre)}
          unidades={unidadesDB}
          onClose={() => setModal(null)}
          onSave={handleEditar}
        />
      )}

      {modal === 'desactivar' && (
        <ConfirmDesactivarModal
          nombre={material.nombre}
          onClose={() => setModal(null)}
          onConfirm={handleDesactivar}
        />
      )}
    </PageWrapper>
  )
}
