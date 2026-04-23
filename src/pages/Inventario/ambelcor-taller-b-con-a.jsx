import React, { useState, useMemo } from "react";
import {
  Package, AlertTriangle, Search, Plus, Wrench, Scissors, Gem, Shirt,
  Boxes, Calendar, Download, Layers, Activity, Clock, X, ArrowUpRight,
  ArrowDownRight, Check, ChevronLeft, FileSpreadsheet, Home, Zap
} from "lucide-react";

// ============ CONST ============
const BRAND = "#91268F";
const BRAND_DARK = "#6d1c6c";
const BRAND_SOFT = "#f5e8f4";

const categorias = {
  telas: { label: "Telas", icon: Shirt, color: "#91268F" },
  pasamaneria: { label: "Pasamanería", icon: Layers, color: "#c9a227" },
  joyeria: { label: "Joyería fallera", icon: Gem, color: "#b8860b" },
  merceria: { label: "Mercería", icon: Scissors, color: "#5b8c5a" },
};

const articulosInit = [
  { id: "TEL-001", nombre: "Espolín seda natural valenciano", cat: "telas", ud: "m", stock: 18.5, min: 10, pmp: 320 },
  { id: "TEL-002", nombre: "Brocado jacquard dorado", cat: "telas", ud: "m", stock: 6.2, min: 8, pmp: 95 },
  { id: "TEL-003", nombre: "Damasco seda bordada marfil", cat: "telas", ud: "m", stock: 12.0, min: 6, pmp: 180 },
  { id: "TEL-004", nombre: "Forro satén acetato", cat: "telas", ud: "m", stock: 45.0, min: 15, pmp: 8.5 },
  { id: "PAS-001", nombre: "Galón metálico dorado 2 cm", cat: "pasamaneria", ud: "m", stock: 32.0, min: 20, pmp: 12 },
  { id: "PAS-002", nombre: "Fleco de seda marfil 8 cm", cat: "pasamaneria", ud: "m", stock: 4.5, min: 10, pmp: 24 },
  { id: "PAS-003", nombre: "Puntilla encaje Valencia 4 cm", cat: "pasamaneria", ud: "m", stock: 22.0, min: 15, pmp: 9 },
  { id: "JOY-001", nombre: "Aguja pecho fallera filigrana", cat: "joyeria", ud: "ud", stock: 7, min: 4, pmp: 145 },
  { id: "JOY-002", nombre: "Peineta concha grande", cat: "joyeria", ud: "ud", stock: 3, min: 3, pmp: 85 },
  { id: "JOY-003", nombre: "Rascamoños joya esmaltado", cat: "joyeria", ud: "ud", stock: 5, min: 4, pmp: 220 },
  { id: "MER-001", nombre: "Hilo poliéster dorado", cat: "merceria", ud: "ud", stock: 24, min: 12, pmp: 3.2 },
  { id: "MER-002", nombre: "Entretela termoadhesiva", cat: "merceria", ud: "m", stock: 28.0, min: 20, pmp: 4 },
  { id: "MER-003", nombre: "Botón forrado 12 mm", cat: "merceria", ud: "ud", stock: 180, min: 100, pmp: 0.35 },
  { id: "MER-004", nombre: "Corchete metálico nº 3", cat: "merceria", ud: "ud", stock: 45, min: 80, pmp: 0.18 },
];

const movimientosInit = [
  { id: 1, fecha: "2026-04-11", tipo: "entrada", art: "TEL-001", cant: 10, coste: 320, ref: "FAC-2604", origen: "Sedería Garín", user: "Carmen" },
  { id: 2, fecha: "2026-04-11", tipo: "salida", art: "TEL-001", cant: 3.5, coste: 320, ref: "AMB-0142", origen: "Encargo Lucía Martí", user: "Carmen" },
  { id: 3, fecha: "2026-04-10", tipo: "entrada", art: "PAS-001", cant: 20, coste: 12, ref: "FAC-2598", origen: "Pasamanería Gil", user: "Carmen" },
  { id: 4, fecha: "2026-04-10", tipo: "salida", art: "JOY-001", cant: 1, coste: 145, ref: "AMB-0141", origen: "Encargo María Bosch", user: "Carmen" },
  { id: 5, fecha: "2026-04-09", tipo: "ajuste", art: "PAS-002", cant: -0.5, coste: 24, ref: "MER-0012", origen: "Merma por corte", user: "Carmen" },
  { id: 6, fecha: "2026-04-09", tipo: "salida", art: "TEL-001", cant: 4.0, coste: 320, ref: "AMB-0140", origen: "Encargo Pilar Serra", user: "Carmen" },
  { id: 7, fecha: "2026-04-08", tipo: "entrada", art: "MER-003", cant: 200, coste: 0.35, ref: "FAC-2591", origen: "Mercería Central", user: "Carmen" },
  { id: 8, fecha: "2026-04-07", tipo: "ajuste", art: "MER-004", cant: -15, coste: 0.18, ref: "INV-0003", origen: "Inventario físico", user: "Carmen" },
];

const fmtEur = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
const fmtNum = (n) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n);

// ============ APP ============
export default function App() {
  const [articulos, setArticulos] = useState(articulosInit);
  const [movimientos, setMovimientos] = useState(movimientosInit);
  const [mode, setMode] = useState("taller"); // 'taller' | 'avanzado'
  const [movModal, setMovModal] = useState(null);
  const [toast, setToast] = useState(null);

  const kpis = useMemo(() => ({
    valor: articulos.reduce((s, a) => s + a.stock * a.pmp, 0),
    bajoMin: articulos.filter(a => a.stock < a.min).length,
    numArt: articulos.length,
    movMes: movimientos.length,
  }), [articulos, movimientos]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const registrarMov = (mov) => {
    setArticulos(prev => prev.map(a => {
      if (a.id !== mov.art) return a;
      let delta = mov.tipo === "entrada" ? mov.cant : mov.tipo === "salida" ? -mov.cant : mov.cant;
      let nuevoPmp = a.pmp;
      if (mov.tipo === "entrada" && mov.coste) {
        const valorActual = a.stock * a.pmp;
        const valorNuevo = mov.cant * mov.coste;
        const stockTotal = a.stock + mov.cant;
        nuevoPmp = stockTotal > 0 ? (valorActual + valorNuevo) / stockTotal : mov.coste;
      }
      return { ...a, stock: Math.max(0, a.stock + delta), pmp: nuevoPmp };
    }));
    setMovimientos(prev => [{ ...mov, id: prev.length + 100, fecha: new Date().toISOString().slice(0, 10), user: "Carmen" }, ...prev]);
    setMovModal(null);
    showToast(`${mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)} registrada`);
  };

  return (
    <div className="min-h-screen" style={{ background: mode === "taller" ? "linear-gradient(180deg, #faf7fa 0%, #f8fafc 100%)" : "#f1f5f9", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      {mode === "taller" ? (
        <VistaTaller articulos={articulos} movimientos={movimientos} kpis={kpis}
          onMov={setMovModal} onModoAvanzado={() => setMode("avanzado")} />
      ) : (
        <VistaAvanzada articulos={articulos} movimientos={movimientos} kpis={kpis}
          onVolver={() => setMode("taller")} onMov={setMovModal} />
      )}

      {movModal && (
        <ModalMovimiento tipo={movModal} articulos={articulos}
          onClose={() => setMovModal(null)} onSave={registrarMov} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm z-[60]">
          <Check className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

// ============ VISTA TALLER (B como principal) ============
function VistaTaller({ articulos, movimientos, kpis, onMov, onModoAvanzado }) {
  const [catFilter, setCatFilter] = useState("todas");
  const [query, setQuery] = useState("");

  const filtered = articulos.filter(a => {
    const okCat = catFilter === "todas" || a.cat === catFilter;
    const okQ = a.nombre.toLowerCase().includes(query.toLowerCase()) || a.id.toLowerCase().includes(query.toLowerCase());
    return okCat && okQ;
  });

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6">
      {/* Header */}
      <header className="bg-white rounded-2xl px-6 py-4 border border-slate-200 flex items-center gap-4 shadow-sm mb-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>A</div>
        <div>
          <div className="font-bold text-slate-800 text-lg">Ambelcor Taller</div>
          <div className="text-xs text-slate-500">Inventario · Indumentaria valenciana</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onModoAvanzado}
            className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 bg-white">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Modo avanzado
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button onClick={() => onMov("entrada")}
            className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition"
            style={{ background: "#059669" }}>
            <ArrowDownRight className="w-4 h-4" /> Entrada
          </button>
          <button onClick={() => onMov("salida")}
            className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition"
            style={{ background: BRAND }}>
            <ArrowUpRight className="w-4 h-4" /> Salida
          </button>
          <button onClick={() => onMov("ajuste")}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition text-slate-700">
            <Wrench className="w-4 h-4" /> Ajuste
          </button>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <KpiB label="Valor de stock" value={fmtEur(kpis.valor)} icon={Boxes} color={BRAND} />
        <KpiB label="Referencias activas" value={kpis.numArt} icon={Package} color="#0f766e" />
        <KpiB label="Bajo mínimo" value={kpis.bajoMin} icon={AlertTriangle} color="#d97706" highlight={kpis.bajoMin > 0} />
        <KpiB label="Movs. del mes" value={kpis.movMes} icon={Activity} color="#059669" />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar en el taller..."
            className="pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white w-64 focus:outline-none focus:ring-2 focus:ring-purple-200" />
        </div>
        <Chip active={catFilter === "todas"} onClick={() => setCatFilter("todas")}>Todas</Chip>
        {Object.entries(categorias).map(([k, v]) => (
          <Chip key={k} active={catFilter === k} onClick={() => setCatFilter(k)} color={v.color}>
            <v.icon className="w-3.5 h-3.5 inline mr-1" />{v.label}
          </Chip>
        ))}
      </div>

      {/* Grid + panel movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(a => {
              const cat = categorias[a.cat];
              const ratio = Math.min(100, (a.stock / Math.max(a.min * 2, 1)) * 100);
              const bajo = a.stock < a.min;
              return (
                <div key={a.id} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: cat.color + "18", color: cat.color }}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-slate-400">{a.id}</div>
                      <div className="font-semibold text-sm text-slate-800 leading-tight line-clamp-2">{a.nombre}</div>
                    </div>
                    {bajo && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold tabular-nums text-slate-800">
                        {fmtNum(a.stock)}<span className="text-sm text-slate-400 font-normal ml-1">{a.ud}</span>
                      </div>
                      <div className="text-xs text-slate-500">mín. {fmtNum(a.min)}</div>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${ratio}%`, background: bajo ? "#f59e0b" : cat.color }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{fmtEur(a.pmp)}/{a.ud}</span>
                      <span className="font-semibold" style={{ color: BRAND }}>{fmtEur(a.stock * a.pmp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
              Sin resultados con estos filtros
            </div>
          )}
        </div>

        <aside className="bg-white rounded-xl border border-slate-200 flex flex-col self-start sticky top-6 max-h-[75vh]">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-slate-800">Últimos movimientos</div>
              <div className="text-[11px] text-slate-500">Abril 2026</div>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 overflow-auto">
            {movimientos.slice(0, 10).map(m => {
              const art = articulos.find(a => a.id === m.art);
              const isIn = m.tipo === "entrada";
              const isAdj = m.tipo === "ajuste";
              const color = isIn ? "#059669" : isAdj ? "#d97706" : BRAND;
              const Icon = isIn ? ArrowDownRight : isAdj ? Wrench : ArrowUpRight;
              return (
                <div key={m.id} className="px-4 py-3 border-b border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: color + "18", color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{art?.nombre}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.origen}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] font-mono text-slate-400">{m.fecha}</span>
                      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
                        {isIn ? "+" : isAdj ? (m.cant > 0 ? "+" : "") : "-"}{fmtNum(Math.abs(m.cant))} {art?.ud}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <div className="mt-6 text-center text-[11px] text-slate-400">
        ¿Cierre de mes o auditoría? Entra en <button onClick={onModoAvanzado} className="underline font-semibold" style={{ color: BRAND }}>Modo avanzado</button> para kardex contable detallado.
      </div>
    </div>
  );
}

// ============ VISTA AVANZADA (A embebida) ============
function VistaAvanzada({ articulos, movimientos, kpis, onVolver, onMov }) {
  const [selected, setSelected] = useState("TEL-001");
  const [query, setQuery] = useState("");

  const filtered = articulos.filter(a =>
    a.nombre.toLowerCase().includes(query.toLowerCase()) ||
    a.id.toLowerCase().includes(query.toLowerCase())
  );
  const art = articulos.find(a => a.id === selected) || articulos[0];
  const movsArt = movimientos.filter(m => m.art === (art?.id));

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6">
      {/* Banner modo avanzado */}
      <div className="mb-4 bg-slate-900 text-white rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-sm">Modo avanzado · Kardex contable</div>
          <div className="text-[11px] text-slate-300">Vista pensada para cierre mensual, auditoría y control de valoración PMP</div>
        </div>
        <button onClick={onVolver}
          className="ml-auto px-3 py-2 text-xs font-semibold bg-white text-slate-900 rounded-lg flex items-center gap-1.5 hover:bg-slate-100">
          <ChevronLeft className="w-3.5 h-3.5" /> Volver al taller
        </button>
      </div>

      {/* KPIs densos */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KpiA icon={Boxes} label="Valor de stock" value={fmtEur(kpis.valor)} tone="brand" />
        <KpiA icon={Package} label="Referencias" value={kpis.numArt} tone="slate" />
        <KpiA icon={AlertTriangle} label="Bajo mínimo" value={kpis.bajoMin} tone="amber" />
        <KpiA icon={Activity} label="Movs. del mes" value={kpis.movMes} tone="green" />
      </div>

      {/* Tabla + kardex */}
      <div className="grid grid-cols-[1fr_360px] gap-3 h-[600px]">
        <section className="bg-white rounded-xl border border-slate-200 flex flex-col min-w-0">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Catálogo</div>
            <div className="relative ml-auto">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-48" />
            </div>
            <button className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-700">
              <Download className="w-3 h-3" /> Exportar
            </button>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">SKU</th>
                  <th className="text-left px-3 py-2 font-medium">Artículo</th>
                  <th className="text-left px-3 py-2 font-medium">Cat.</th>
                  <th className="text-right px-3 py-2 font-medium">Stock</th>
                  <th className="text-right px-3 py-2 font-medium">Mín.</th>
                  <th className="text-right px-3 py-2 font-medium">PMP</th>
                  <th className="text-right px-3 py-2 font-medium">Valor</th>
                  <th className="text-center px-3 py-2 font-medium">Est.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const bajo = a.stock < a.min;
                  const cat = categorias[a.cat];
                  return (
                    <tr key={a.id} onClick={() => setSelected(a.id)}
                      className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${selected === a.id ? "bg-purple-50" : ""}`}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{a.id}</td>
                      <td className="px-3 py-2 text-slate-800">{a.nombre}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: cat.color + "20", color: cat.color }}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNum(a.stock)} {a.ud}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-400">{fmtNum(a.min)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtEur(a.pmp)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtEur(a.stock * a.pmp)}</td>
                      <td className="px-3 py-2 text-center">
                        {bajo
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">BAJO</span>
                          : <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="bg-white rounded-xl border border-slate-200 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200" style={{ background: BRAND_SOFT }}>
            <div className="text-[10px] font-mono text-slate-500">{art.id}</div>
            <div className="text-sm font-semibold text-slate-800">{art.nombre}</div>
            <div className="text-xs text-slate-500 mt-0.5">{categorias[art.cat].label} · {art.ud}</div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-200">
            <div className="bg-white p-3">
              <div className="text-[10px] text-slate-500 uppercase">Stock actual</div>
              <div className="text-lg font-semibold tabular-nums">{fmtNum(art.stock)} <span className="text-xs text-slate-400">{art.ud}</span></div>
            </div>
            <div className="bg-white p-3">
              <div className="text-[10px] text-slate-500 uppercase">Valor PMP</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: BRAND }}>{fmtEur(art.stock * art.pmp)}</div>
            </div>
          </div>
          <div className="p-2 flex gap-1 border-b border-slate-100">
            <button onClick={() => onMov("entrada")} className="flex-1 px-2 py-1.5 text-[11px] font-semibold text-white rounded-md" style={{ background: "#059669" }}>+ Entrada</button>
            <button onClick={() => onMov("salida")} className="flex-1 px-2 py-1.5 text-[11px] font-semibold text-white rounded-md" style={{ background: BRAND }}>− Salida</button>
            <button onClick={() => onMov("ajuste")} className="flex-1 px-2 py-1.5 text-[11px] font-semibold text-white rounded-md" style={{ background: "#d97706" }}>± Ajuste</button>
          </div>
          <div className="px-4 py-2 border-t border-slate-100 text-[11px] uppercase font-semibold text-slate-500 tracking-wide flex items-center justify-between">
            <span>Kardex · Movimientos</span>
            <Clock className="w-3 h-3" />
          </div>
          <div className="flex-1 overflow-auto">
            {movsArt.length === 0 && (
              <div className="p-4 text-xs text-slate-400 text-center">Sin movimientos registrados</div>
            )}
            {movsArt.map(m => {
              const isIn = m.tipo === "entrada";
              const isAdj = m.tipo === "ajuste";
              const sign = isIn ? "+" : isAdj ? (m.cant > 0 ? "+" : "") : "-";
              const color = isIn ? "#059669" : isAdj ? "#d97706" : "#dc2626";
              return (
                <div key={m.id} className="px-4 py-2.5 border-b border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">{m.fecha}</span>
                    <span className="tabular-nums font-semibold" style={{ color }}>
                      {sign}{fmtNum(Math.abs(m.cant))} {art.ud}
                    </span>
                  </div>
                  <div className="text-slate-700 mt-0.5">{m.origen}</div>
                  <div className="text-slate-400 text-[10px] font-mono">{m.ref}</div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============ KPI CARDS ============
function KpiB({ label, value, icon: Icon, color, highlight }) {
  return (
    <div className={`bg-white rounded-2xl p-4 border ${highlight ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18", color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800 tabular-nums mt-2">{value}</div>
    </div>
  );
}

function KpiA({ icon: Icon, label, value, tone }) {
  const tones = {
    brand: { bg: BRAND_SOFT, fg: BRAND },
    slate: { bg: "#f1f5f9", fg: "#475569" },
    amber: { bg: "#fef3c7", fg: "#d97706" },
    green: { bg: "#d1fae5", fg: "#059669" },
  };
  const t = tones[tone];
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: t.bg, color: t.fg }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-lg font-semibold text-slate-800 tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function Chip({ children, active, onClick, color }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${active ? "text-white border-transparent" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
      style={active ? { background: color || BRAND } : {}}>
      {children}
    </button>
  );
}

// ============ MODAL ============
function ModalMovimiento({ tipo, articulos, onClose, onSave }) {
  const [art, setArt] = useState(articulos[0].id);
  const [cant, setCant] = useState("");
  const [coste, setCoste] = useState("");
  const [ref, setRef] = useState("");
  const [origen, setOrigen] = useState("");

  const articulo = articulos.find(a => a.id === art);
  const color = tipo === "entrada" ? "#059669" : tipo === "ajuste" ? "#d97706" : BRAND;

  const handleSave = () => {
    if (!cant) return;
    const cantNum = parseFloat(cant);
    onSave({
      tipo, art,
      cant: tipo === "ajuste" ? cantNum : Math.abs(cantNum),
      coste: parseFloat(coste) || articulo.pmp,
      ref: ref || `${tipo.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      origen: origen || (tipo === "entrada" ? "Compra" : tipo === "salida" ? "Encargo" : "Ajuste"),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-[520px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: color + "15" }}>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>Registrar movimiento</div>
            <div className="text-xl font-bold text-slate-800 capitalize">{tipo}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Artículo">
            <select value={art} onChange={e => setArt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              {articulos.map(a => <option key={a.id} value={a.id}>{a.id} · {a.nombre} ({fmtNum(a.stock)} {a.ud})</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tipo === "ajuste" ? "Cantidad (+/−)" : "Cantidad"}>
              <div className="relative">
                <input type="number" value={cant} onChange={e => setCant(e.target.value)} step="0.01"
                  placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm pr-12" />
                <div className="absolute right-3 top-2.5 text-xs text-slate-400">{articulo.ud}</div>
              </div>
            </Field>
            <Field label={tipo === "entrada" ? "Coste/ud (€)" : "Coste (PMP)"}>
              <input type="number" value={coste} onChange={e => setCoste(e.target.value)} step="0.01"
                placeholder={fmtNum(articulo.pmp)}
                disabled={tipo !== "entrada"}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400" />
            </Field>
          </div>
          <Field label={tipo === "entrada" ? "Proveedor / Factura" : tipo === "salida" ? "Encargo / Cliente" : "Motivo"}>
            <input value={origen} onChange={e => setOrigen(e.target.value)}
              placeholder={tipo === "entrada" ? "Sedería Garín · FAC-2605" : tipo === "salida" ? "Encargo Carmen García" : "Merma por corte"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </Field>
          <Field label="Referencia">
            <input value={ref} onChange={e => setRef(e.target.value)}
              placeholder={tipo === "entrada" ? "FAC-2605" : tipo === "salida" ? "AMB-0143" : "INV-0004"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </Field>
          {cant && (
            <div className="p-3 rounded-lg border text-xs space-y-1" style={{ background: color + "10", borderColor: color + "30" }}>
              <div className="flex justify-between"><span className="text-slate-600">Stock actual:</span><span className="tabular-nums">{fmtNum(articulo.stock)} {articulo.ud}</span></div>
              <div className="flex justify-between font-semibold" style={{ color }}>
                <span>Stock resultante:</span>
                <span className="tabular-nums">
                  {fmtNum(articulo.stock + (tipo === "entrada" ? parseFloat(cant) : tipo === "salida" ? -parseFloat(cant) : parseFloat(cant)))} {articulo.ud}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave} disabled={!cant}
            className="px-4 py-2 text-sm text-white rounded-lg font-semibold disabled:opacity-40"
            style={{ background: color }}>
            Confirmar {tipo}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
}
