import React, { useState, useMemo } from "react";
import {
  Package, AlertTriangle, Search, Plus, Settings, FileText, Users,
  BarChart3, Home, ArrowUpRight, ArrowDownRight, Wrench, Scissors, Gem,
  Shirt, Boxes, Calendar, Download, Layers, Activity, Clock, X,
  TrendingUp, Filter, ChevronRight, Eye, Edit3, Trash2, Check,
  Phone, Mail, MapPin, Building2, Save, Bell, Palette, Globe
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

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
  { id: "TEL-001", nombre: "Espolín seda natural valenciano", cat: "telas", ud: "m", stock: 18.5, min: 10, pmp: 320, prov: "PRV-01" },
  { id: "TEL-002", nombre: "Brocado jacquard dorado", cat: "telas", ud: "m", stock: 6.2, min: 8, pmp: 95, prov: "PRV-01" },
  { id: "TEL-003", nombre: "Damasco seda bordada marfil", cat: "telas", ud: "m", stock: 12.0, min: 6, pmp: 180, prov: "PRV-02" },
  { id: "TEL-004", nombre: "Forro satén acetato", cat: "telas", ud: "m", stock: 45.0, min: 15, pmp: 8.5, prov: "PRV-03" },
  { id: "PAS-001", nombre: "Galón metálico dorado 2 cm", cat: "pasamaneria", ud: "m", stock: 32.0, min: 20, pmp: 12, prov: "PRV-04" },
  { id: "PAS-002", nombre: "Fleco de seda marfil 8 cm", cat: "pasamaneria", ud: "m", stock: 4.5, min: 10, pmp: 24, prov: "PRV-04" },
  { id: "PAS-003", nombre: "Puntilla encaje Valencia 4 cm", cat: "pasamaneria", ud: "m", stock: 22.0, min: 15, pmp: 9, prov: "PRV-05" },
  { id: "JOY-001", nombre: "Aguja pecho fallera filigrana", cat: "joyeria", ud: "ud", stock: 7, min: 4, pmp: 145, prov: "PRV-06" },
  { id: "JOY-002", nombre: "Peineta concha grande", cat: "joyeria", ud: "ud", stock: 3, min: 3, pmp: 85, prov: "PRV-06" },
  { id: "JOY-003", nombre: "Rascamoños joya esmaltado", cat: "joyeria", ud: "ud", stock: 5, min: 4, pmp: 220, prov: "PRV-07" },
  { id: "MER-001", nombre: "Hilo poliéster dorado", cat: "merceria", ud: "ud", stock: 24, min: 12, pmp: 3.2, prov: "PRV-08" },
  { id: "MER-002", nombre: "Entretela termoadhesiva", cat: "merceria", ud: "m", stock: 28.0, min: 20, pmp: 4, prov: "PRV-03" },
  { id: "MER-003", nombre: "Botón forrado 12 mm", cat: "merceria", ud: "ud", stock: 180, min: 100, pmp: 0.35, prov: "PRV-08" },
  { id: "MER-004", nombre: "Corchete metálico nº 3", cat: "merceria", ud: "ud", stock: 45, min: 80, pmp: 0.18, prov: "PRV-08" },
];

const proveedoresInit = [
  { id: "PRV-01", nombre: "Sedería Garín", cif: "B-46012345", tel: "963 521 000", email: "ventas@garin.es", ciudad: "Moncada", cat: "telas", ultima: "2026-04-11" },
  { id: "PRV-02", nombre: "Vives y Marí", cif: "B-46099821", tel: "962 310 445", email: "pedidos@vivesymari.com", ciudad: "Valencia", cat: "telas", ultima: "2026-03-28" },
  { id: "PRV-03", nombre: "Textiles Ruiz", cif: "B-46011122", tel: "961 445 332", email: "info@textilesruiz.es", ciudad: "Mislata", cat: "telas", ultima: "2026-04-02" },
  { id: "PRV-04", nombre: "Pasamanería Gil", cif: "B-46044210", tel: "963 887 221", email: "gil@pasamaneria.com", ciudad: "Valencia", cat: "pasamaneria", ultima: "2026-04-10" },
  { id: "PRV-05", nombre: "Encajes Almoines", cif: "B-46099004", tel: "962 889 112", email: "encajes@almoines.es", ciudad: "Almoines", cat: "pasamaneria", ultima: "2026-03-15" },
  { id: "PRV-06", nombre: "Orfebrería Piró", cif: "B-46100998", tel: "963 321 009", email: "piro@orfebreria.es", ciudad: "Valencia", cat: "joyeria", ultima: "2026-04-05" },
  { id: "PRV-07", nombre: "Joyería Devesa", cif: "B-46100556", tel: "963 228 110", email: "devesa@joyeria.com", ciudad: "Paiporta", cat: "joyeria", ultima: "2026-03-22" },
  { id: "PRV-08", nombre: "Mercería Central", cif: "B-46033221", tel: "963 112 998", email: "central@merceria.es", ciudad: "Valencia", cat: "merceria", ultima: "2026-04-08" },
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
  { id: 9, fecha: "2026-04-05", tipo: "entrada", art: "JOY-001", cant: 3, coste: 145, ref: "FAC-2580", origen: "Orfebrería Piró", user: "Carmen" },
  { id: 10, fecha: "2026-04-04", tipo: "salida", art: "PAS-001", cant: 2.5, coste: 12, ref: "AMB-0139", origen: "Encargo Ana Ferrer", user: "Carmen" },
  { id: 11, fecha: "2026-04-03", tipo: "entrada", art: "TEL-003", cant: 8, coste: 180, ref: "FAC-2575", origen: "Vives y Marí", user: "Carmen" },
  { id: 12, fecha: "2026-04-02", tipo: "salida", art: "MER-003", cant: 40, coste: 0.35, ref: "AMB-0138", origen: "Encargo Carmen García", user: "Carmen" },
];

// ============ HELPERS ============
const fmtEur = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
const fmtNum = (n) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n);

// ============ APP ============
export default function App() {
  const [articulos, setArticulos] = useState(articulosInit);
  const [proveedores] = useState(proveedoresInit);
  const [movimientos, setMovimientos] = useState(movimientosInit);
  const [section, setSection] = useState("panel");
  const [movModal, setMovModal] = useState(null); // 'entrada' | 'salida' | 'ajuste'
  const [toast, setToast] = useState(null);

  const kpis = useMemo(() => {
    const valor = articulos.reduce((s, a) => s + a.stock * a.pmp, 0);
    const bajoMin = articulos.filter(a => a.stock < a.min).length;
    return { valor, bajoMin, numArt: articulos.length, movMes: movimientos.length };
  }, [articulos, movimientos]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const registrarMov = (mov) => {
    // actualizar stock
    setArticulos(prev => prev.map(a => {
      if (a.id !== mov.art) return a;
      let delta = 0;
      if (mov.tipo === "entrada") delta = mov.cant;
      else if (mov.tipo === "salida") delta = -mov.cant;
      else delta = mov.cant; // ajuste puede ser negativo
      // PMP solo se recalcula en entrada
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
    showToast(`${mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)} registrada correctamente`);
  };

  const menu = [
    { id: "panel", label: "Panel", icon: Home },
    { id: "articulos", label: "Artículos", icon: Package, badge: kpis.bajoMin > 0 ? kpis.bajoMin : null },
    { id: "movimientos", label: "Movimientos", icon: Activity },
    { id: "proveedores", label: "Proveedores", icon: Users },
    { id: "informes", label: "Informes", icon: BarChart3 },
    { id: "ajustes", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>A</div>
          <div>
            <div className="font-bold text-white">Ambelcor</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Inventario</div>
          </div>
        </div>
        <nav className="flex-1 py-3 text-sm">
          {menu.map(m => (
            <button key={m.id} onClick={() => setSection(m.id)}
              className={`w-full px-5 py-2.5 flex items-center gap-3 transition ${section === m.id ? "bg-slate-800 border-l-[3px] text-white" : "border-l-[3px] border-transparent hover:bg-slate-800/50"}`}
              style={section === m.id ? { borderLeftColor: BRAND } : {}}>
              <m.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{m.label}</span>
              {m.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">{m.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick actions */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 mb-1">Registro rápido</div>
          <button onClick={() => setMovModal("entrada")}
            className="w-full px-3 py-2 text-xs font-semibold text-white rounded-lg flex items-center gap-2 hover:opacity-90"
            style={{ background: "#059669" }}>
            <ArrowDownRight className="w-3.5 h-3.5" /> Entrada
          </button>
          <button onClick={() => setMovModal("salida")}
            className="w-full px-3 py-2 text-xs font-semibold text-white rounded-lg flex items-center gap-2 hover:opacity-90"
            style={{ background: BRAND }}>
            <ArrowUpRight className="w-3.5 h-3.5" /> Salida
          </button>
          <button onClick={() => setMovModal("ajuste")}
            className="w-full px-3 py-2 text-xs font-semibold text-white rounded-lg flex items-center gap-2 hover:opacity-90"
            style={{ background: "#d97706" }}>
            <Wrench className="w-3.5 h-3.5" /> Ajuste
          </button>
        </div>

        <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-[10px]">C</div>
          <div>
            <div className="text-slate-300">Carmen</div>
            <div>Administradora</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Ambelcor · Taller de indumentaria valenciana</div>
            <div className="text-sm font-semibold text-slate-800 capitalize">{menu.find(m => m.id === section)?.label}</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 hover:bg-slate-100 rounded-lg">
              <Bell className="w-4 h-4 text-slate-600" />
              {kpis.bajoMin > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>}
            </button>
            <div className="text-xs text-slate-500 border-l border-slate-200 pl-3">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {section === "panel" && <SeccionPanel articulos={articulos} movimientos={movimientos} kpis={kpis} onNav={setSection} />}
          {section === "articulos" && <SeccionArticulos articulos={articulos} movimientos={movimientos} onMov={setMovModal} />}
          {section === "movimientos" && <SeccionMovimientos articulos={articulos} movimientos={movimientos} />}
          {section === "proveedores" && <SeccionProveedores proveedores={proveedores} articulos={articulos} />}
          {section === "informes" && <SeccionInformes articulos={articulos} movimientos={movimientos} />}
          {section === "ajustes" && <SeccionAjustes onToast={showToast} />}
        </div>
      </main>

      {/* Modal movimiento */}
      {movModal && (
        <ModalMovimiento tipo={movModal} articulos={articulos} proveedores={proveedores}
          onClose={() => setMovModal(null)} onSave={registrarMov} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm z-50">
          <Check className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

// ============ PANEL ============
function SeccionPanel({ articulos, movimientos, kpis, onNav }) {
  const bajoMin = articulos.filter(a => a.stock < a.min);
  const valorPorCat = Object.keys(categorias).map(k => ({
    name: categorias[k].label,
    value: articulos.filter(a => a.cat === k).reduce((s, a) => s + a.stock * a.pmp, 0),
    color: categorias[k].color,
  }));
  // movimientos últimos 7 días
  const movs7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const f = d.toISOString().slice(0, 10);
    const entradas = movimientos.filter(m => m.fecha === f && m.tipo === "entrada").length;
    const salidas = movimientos.filter(m => m.fecha === f && m.tipo === "salida").length;
    return { dia: d.toLocaleDateString("es-ES", { weekday: "short" }), entradas, salidas };
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Valor de stock" value={fmtEur(kpis.valor)} icon={Boxes} color={BRAND} onClick={() => onNav("articulos")} />
        <KpiCard label="Referencias" value={kpis.numArt} icon={Package} color="#0f766e" onClick={() => onNav("articulos")} />
        <KpiCard label="Bajo mínimo" value={kpis.bajoMin} icon={AlertTriangle} color="#d97706" alert={kpis.bajoMin > 0} onClick={() => onNav("articulos")} />
        <KpiCard label="Movs. del mes" value={kpis.movMes} icon={Activity} color="#059669" onClick={() => onNav("movimientos")} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card title="Movimientos últimos 7 días" className="col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={movs7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entradas" fill="#059669" radius={[6, 6, 0, 0]} />
              <Bar dataKey="salidas" fill={BRAND} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Valor por categoría">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={valorPorCat} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                {valorPorCat.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtEur(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {valorPorCat.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }}></div>
                  <span className="text-slate-600">{c.name}</span>
                </div>
                <span className="font-semibold tabular-nums">{fmtEur(c.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card title={`Alertas de stock (${bajoMin.length})`} titleIcon={AlertTriangle} titleColor="#d97706">
          {bajoMin.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">Todo en orden, sin alertas 👌</div>
          ) : (
            <div className="space-y-2">
              {bajoMin.map(a => {
                const cat = categorias[a.cat];
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-amber-100 bg-amber-50/40">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cat.color + "20", color: cat.color }}>
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{a.nombre}</div>
                      <div className="text-[11px] text-slate-500">{a.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-600 tabular-nums">{fmtNum(a.stock)} {a.ud}</div>
                      <div className="text-[10px] text-slate-500">mín. {fmtNum(a.min)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Últimos movimientos" titleIcon={Clock}>
          <div className="space-y-2 max-h-[280px] overflow-auto">
            {movimientos.slice(0, 6).map(m => {
              const art = articulos.find(a => a.id === m.art);
              const isIn = m.tipo === "entrada";
              const isAdj = m.tipo === "ajuste";
              const color = isIn ? "#059669" : isAdj ? "#d97706" : BRAND;
              const Icon = isIn ? ArrowDownRight : isAdj ? Wrench : ArrowUpRight;
              return (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "18", color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{art?.nombre}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.origen} · {m.ref}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tabular-nums" style={{ color }}>
                      {isIn ? "+" : isAdj ? (m.cant > 0 ? "+" : "") : "-"}{fmtNum(Math.abs(m.cant))}
                    </div>
                    <div className="text-[10px] text-slate-400">{m.fecha}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============ ARTÍCULOS ============
function SeccionArticulos({ articulos, movimientos, onMov }) {
  const [view, setView] = useState("grid"); // grid | table
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("todas");
  const [stockFilter, setStockFilter] = useState("todos");
  const [selected, setSelected] = useState(null);

  const filtered = articulos.filter(a => {
    const okCat = catFilter === "todas" || a.cat === catFilter;
    const okQ = a.nombre.toLowerCase().includes(query.toLowerCase()) || a.id.toLowerCase().includes(query.toLowerCase());
    const okStock = stockFilter === "todos" || (stockFilter === "bajo" && a.stock < a.min) || (stockFilter === "ok" && a.stock >= a.min);
    return okCat && okQ && okStock;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar artículo o SKU..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white w-64 focus:outline-none focus:ring-2 focus:ring-purple-200" />
        </div>
        <Chip active={catFilter === "todas"} onClick={() => setCatFilter("todas")}>Todas las categorías</Chip>
        {Object.entries(categorias).map(([k, v]) => (
          <Chip key={k} active={catFilter === k} onClick={() => setCatFilter(k)} color={v.color}>
            <v.icon className="w-3.5 h-3.5 inline mr-1" />{v.label}
          </Chip>
        ))}
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <Chip active={stockFilter === "todos"} onClick={() => setStockFilter("todos")}>Todos</Chip>
        <Chip active={stockFilter === "bajo"} onClick={() => setStockFilter("bajo")} color="#d97706">Bajo mínimo</Chip>
        <Chip active={stockFilter === "ok"} onClick={() => setStockFilter("ok")} color="#059669">OK</Chip>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
            <button onClick={() => setView("grid")} className={`px-3 py-1 text-xs font-medium rounded ${view === "grid" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Tarjetas</button>
            <button onClick={() => setView("table")} className={`px-3 py-1 text-xs font-medium rounded ${view === "table" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Tabla</button>
          </div>
          <button className="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {view === "grid" ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(a => {
                const cat = categorias[a.cat];
                const ratio = Math.min(100, (a.stock / Math.max(a.min * 2, 1)) * 100);
                const bajo = a.stock < a.min;
                return (
                  <div key={a.id} onClick={() => setSelected(a.id)}
                    className={`bg-white rounded-xl p-4 border cursor-pointer transition hover:shadow-md ${selected === a.id ? "border-purple-400 ring-2 ring-purple-100" : "border-slate-200"}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: cat.color + "18", color: cat.color }}>
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
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-medium">SKU</th>
                    <th className="text-left px-3 py-2.5 font-medium">Artículo</th>
                    <th className="text-left px-3 py-2.5 font-medium">Cat.</th>
                    <th className="text-right px-3 py-2.5 font-medium">Stock</th>
                    <th className="text-right px-3 py-2.5 font-medium">Mín.</th>
                    <th className="text-right px-3 py-2.5 font-medium">PMP</th>
                    <th className="text-right px-3 py-2.5 font-medium">Valor</th>
                    <th className="text-center px-3 py-2.5 font-medium">Est.</th>
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
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: cat.color + "20", color: cat.color }}>{cat.label}</span>
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
          )}

          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
              No se han encontrado artículos con estos filtros
            </div>
          )}
        </div>

        {/* Panel detalle kardex */}
        {selected && (
          <PanelKardex articulo={articulos.find(a => a.id === selected)}
            movimientos={movimientos.filter(m => m.art === selected)}
            onClose={() => setSelected(null)} onMov={onMov} />
        )}
      </div>
    </div>
  );
}

function PanelKardex({ articulo, movimientos, onClose, onMov }) {
  return (
    <aside className="w-[360px] bg-white rounded-xl border border-slate-200 flex flex-col shrink-0 self-start sticky top-0">
      <div className="px-4 py-3 border-b border-slate-200 flex items-start gap-2" style={{ background: BRAND_SOFT }}>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono text-slate-500">{articulo.id}</div>
          <div className="text-sm font-semibold text-slate-800 leading-tight">{articulo.nombre}</div>
          <div className="text-xs text-slate-500 mt-0.5">{categorias[articulo.cat].label} · {articulo.ud}</div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/50 rounded"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-200">
        <div className="bg-white p-3">
          <div className="text-[10px] text-slate-500 uppercase">Stock</div>
          <div className="text-lg font-semibold tabular-nums">{fmtNum(articulo.stock)} <span className="text-xs text-slate-400">{articulo.ud}</span></div>
        </div>
        <div className="bg-white p-3">
          <div className="text-[10px] text-slate-500 uppercase">Valor</div>
          <div className="text-lg font-semibold tabular-nums" style={{ color: BRAND }}>{fmtEur(articulo.stock * articulo.pmp)}</div>
        </div>
      </div>
      <div className="p-3 flex gap-1.5 border-b border-slate-100">
        <button onClick={() => onMov("entrada")} className="flex-1 px-2 py-1.5 text-[11px] font-semibold text-white rounded-md" style={{ background: "#059669" }}>+ Entrada</button>
        <button onClick={() => onMov("salida")} className="flex-1 px-2 py-1.5 text-[11px] font-semibold text-white rounded-md" style={{ background: BRAND }}>− Salida</button>
        <button onClick={() => onMov("ajuste")} className="flex-1 px-2 py-1.5 text-[11px] font-semibold text-white rounded-md" style={{ background: "#d97706" }}>± Ajuste</button>
      </div>
      <div className="px-4 py-2 text-[11px] uppercase font-semibold text-slate-500 tracking-wide">Kardex</div>
      <div className="flex-1 overflow-auto max-h-[400px]">
        {movimientos.length === 0 && <div className="p-4 text-xs text-slate-400 text-center">Sin movimientos</div>}
        {movimientos.map(m => {
          const isIn = m.tipo === "entrada";
          const isAdj = m.tipo === "ajuste";
          const sign = isIn ? "+" : isAdj ? (m.cant > 0 ? "+" : "") : "-";
          const color = isIn ? "#059669" : isAdj ? "#d97706" : BRAND;
          return (
            <div key={m.id} className="px-4 py-2.5 border-b border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-400">{m.fecha}</span>
                <span className="tabular-nums font-semibold" style={{ color }}>{sign}{fmtNum(Math.abs(m.cant))} {articulo.ud}</span>
              </div>
              <div className="text-slate-700 mt-0.5">{m.origen}</div>
              <div className="text-slate-400 text-[10px] font-mono">{m.ref}</div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ============ MOVIMIENTOS ============
function SeccionMovimientos({ articulos, movimientos }) {
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [query, setQuery] = useState("");

  const filtered = movimientos.filter(m => {
    const art = articulos.find(a => a.id === m.art);
    const okTipo = tipoFilter === "todos" || m.tipo === tipoFilter;
    const okQ = !query || art?.nombre.toLowerCase().includes(query.toLowerCase()) || m.ref.toLowerCase().includes(query.toLowerCase()) || m.origen.toLowerCase().includes(query.toLowerCase());
    return okTipo && okQ;
  });

  const stats = {
    entradas: movimientos.filter(m => m.tipo === "entrada").length,
    salidas: movimientos.filter(m => m.tipo === "salida").length,
    ajustes: movimientos.filter(m => m.tipo === "ajuste").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <MovStatCard label="Entradas" count={stats.entradas} color="#059669" icon={ArrowDownRight} active={tipoFilter === "entrada"} onClick={() => setTipoFilter(tipoFilter === "entrada" ? "todos" : "entrada")} />
        <MovStatCard label="Salidas" count={stats.salidas} color={BRAND} icon={ArrowUpRight} active={tipoFilter === "salida"} onClick={() => setTipoFilter(tipoFilter === "salida" ? "todos" : "salida")} />
        <MovStatCard label="Ajustes" count={stats.ajustes} color="#d97706" icon={Wrench} active={tipoFilter === "ajuste"} onClick={() => setTipoFilter(tipoFilter === "ajuste" ? "todos" : "ajuste")} />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por artículo, referencia u origen..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white w-full" />
        </div>
        <button onClick={() => setTipoFilter("todos")} className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Limpiar filtros</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
              <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
              <th className="text-left px-4 py-2.5 font-medium">Artículo</th>
              <th className="text-left px-4 py-2.5 font-medium">Origen / destino</th>
              <th className="text-left px-4 py-2.5 font-medium">Referencia</th>
              <th className="text-right px-4 py-2.5 font-medium">Cantidad</th>
              <th className="text-right px-4 py-2.5 font-medium">Coste</th>
              <th className="text-right px-4 py-2.5 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const art = articulos.find(a => a.id === m.art);
              const isIn = m.tipo === "entrada";
              const isAdj = m.tipo === "ajuste";
              const color = isIn ? "#059669" : isAdj ? "#d97706" : BRAND;
              const sign = isIn ? "+" : isAdj ? (m.cant > 0 ? "+" : "") : "-";
              return (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{m.fecha}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                      style={{ background: color + "20", color }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-800">{art?.nombre}</div>
                    <div className="text-[11px] font-mono text-slate-400">{m.art}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{m.origen}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{m.ref}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold" style={{ color }}>
                    {sign}{fmtNum(Math.abs(m.cant))} {art?.ud}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmtEur(m.coste)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{fmtEur(Math.abs(m.cant) * m.coste)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">No hay movimientos con estos filtros</div>
        )}
      </div>
    </div>
  );
}

function MovStatCard({ label, count, color, icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`bg-white rounded-xl p-4 border text-left w-full transition ${active ? "ring-2 shadow-md" : "hover:shadow-sm"}`}
      style={active ? { borderColor: color, "--tw-ring-color": color + "40" } : { borderColor: "#e2e8f0" }}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18", color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-3xl font-bold tabular-nums mt-2" style={{ color }}>{count}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{active ? "Filtro activo · click para quitar" : "Click para filtrar"}</div>
    </button>
  );
}

// ============ PROVEEDORES ============
function SeccionProveedores({ proveedores, articulos }) {
  const [selected, setSelected] = useState(proveedores[0].id);
  const prov = proveedores.find(p => p.id === selected);
  const arts = articulos.filter(a => a.prov === selected);
  const valorTotal = arts.reduce((s, a) => s + a.stock * a.pmp, 0);

  return (
    <div className="flex gap-5">
      <div className="w-80 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Proveedores ({proveedores.length})</div>
          <button className="text-xs text-white font-semibold px-2 py-1 rounded" style={{ background: BRAND }}>+ Nuevo</button>
        </div>
        <div className="overflow-auto max-h-[600px]">
          {proveedores.map(p => {
            const cat = categorias[p.cat];
            return (
              <button key={p.id} onClick={() => setSelected(p.id)}
                className={`w-full px-4 py-3 border-b border-slate-100 text-left hover:bg-slate-50 flex items-center gap-3 ${selected === p.id ? "bg-purple-50" : ""}`}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: cat.color + "18", color: cat.color }}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-800 truncate">{p.nombre}</div>
                  <div className="text-[11px] text-slate-500 truncate">{p.ciudad} · {cat.label}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: categorias[prov.cat].color + "18", color: categorias[prov.cat].color }}>
              <Building2 className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-mono text-slate-400">{prov.id}</div>
              <div className="text-xl font-bold text-slate-800">{prov.nombre}</div>
              <div className="text-sm text-slate-500">CIF {prov.cif} · {categorias[prov.cat].label}</div>
            </div>
            <button className="px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
            <InfoTile icon={Phone} label="Teléfono" value={prov.tel} />
            <InfoTile icon={Mail} label="Email" value={prov.email} />
            <InfoTile icon={MapPin} label="Ciudad" value={prov.ciudad} />
            <InfoTile icon={Calendar} label="Última compra" value={prov.ultima} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Artículos suministrados" value={arts.length} icon={Package} color={BRAND} />
          <KpiCard label="Valor en stock" value={fmtEur(valorTotal)} icon={Boxes} color="#0f766e" />
          <KpiCard label="Categoría principal" value={categorias[prov.cat].label} icon={categorias[prov.cat].icon} color={categorias[prov.cat].color} />
        </div>

        <Card title="Artículos de este proveedor">
          {arts.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">Sin artículos asociados</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-medium">SKU</th>
                  <th className="text-left py-2 font-medium">Artículo</th>
                  <th className="text-right py-2 font-medium">Stock</th>
                  <th className="text-right py-2 font-medium">PMP</th>
                  <th className="text-right py-2 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {arts.map(a => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="py-2 font-mono text-xs text-slate-500">{a.id}</td>
                    <td className="py-2 text-slate-800">{a.nombre}</td>
                    <td className="py-2 text-right tabular-nums">{fmtNum(a.stock)} {a.ud}</td>
                    <td className="py-2 text-right tabular-nums">{fmtEur(a.pmp)}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{fmtEur(a.stock * a.pmp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-sm text-slate-700 truncate">{value}</div>
      </div>
    </div>
  );
}

// ============ INFORMES ============
function SeccionInformes({ articulos, movimientos }) {
  const [periodo, setPeriodo] = useState("mes");

  const porCat = Object.keys(categorias).map(k => {
    const arts = articulos.filter(a => a.cat === k);
    return {
      name: categorias[k].label,
      stock: arts.reduce((s, a) => s + a.stock * a.pmp, 0),
      count: arts.length,
      color: categorias[k].color,
    };
  });

  // Top artículos por movimiento
  const topMov = Object.entries(
    movimientos.reduce((acc, m) => {
      acc[m.art] = (acc[m.art] || 0) + Math.abs(m.cant);
      return acc;
    }, {})
  ).map(([id, cant]) => ({ ...articulos.find(a => a.id === id), movs: cant }))
    .filter(a => a.id)
    .sort((a, b) => b.movs - a.movs)
    .slice(0, 5);

  // Entradas vs salidas por categoría (valor)
  const flujoPorCat = Object.keys(categorias).map(k => {
    const arts = articulos.filter(a => a.cat === k).map(a => a.id);
    const entradas = movimientos.filter(m => m.tipo === "entrada" && arts.includes(m.art))
      .reduce((s, m) => s + m.cant * m.coste, 0);
    const salidas = movimientos.filter(m => m.tipo === "salida" && arts.includes(m.art))
      .reduce((s, m) => s + m.cant * m.coste, 0);
    return { name: categorias[k].label, entradas, salidas };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="text-xs text-slate-500">Período:</div>
        {["semana", "mes", "trimestre", "año"].map(p => (
          <Chip key={p} active={periodo === p} onClick={() => setPeriodo(p)}>{p}</Chip>
        ))}
        <button className="ml-auto px-3 py-2 text-xs font-medium text-white rounded-lg flex items-center gap-1.5" style={{ background: BRAND }}>
          <Download className="w-3.5 h-3.5" /> Descargar informe PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card title="Valor de stock por categoría">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porCat} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => fmtEur(v)} />
              <Bar dataKey="stock" radius={[0, 6, 6, 0]}>
                {porCat.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Flujo económico por categoría">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={flujoPorCat}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
              <Tooltip formatter={v => fmtEur(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entradas" fill="#059669" radius={[6, 6, 0, 0]} />
              <Bar dataKey="salidas" fill={BRAND} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Top 5 artículos con más movimiento" titleIcon={TrendingUp}>
        <div className="space-y-2">
          {topMov.map((a, i) => {
            const cat = categorias[a.cat];
            const max = topMov[0].movs;
            return (
              <div key={a.id} className="flex items-center gap-3 p-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{i + 1}</div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cat.color + "18", color: cat.color }}>
                  <cat.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{a.nombre}</div>
                  <div className="text-[11px] text-slate-500">{a.id}</div>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(a.movs / max) * 100}%`, background: cat.color }} />
                  </div>
                </div>
                <div className="text-sm font-bold tabular-nums w-20 text-right">{fmtNum(a.movs)} {a.ud}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ============ AJUSTES ============
function SeccionAjustes({ onToast }) {
  const [tab, setTab] = useState("empresa");
  const tabs = [
    { id: "empresa", label: "Empresa", icon: Building2 },
    { id: "categorias", label: "Categorías", icon: Layers },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "apariencia", label: "Apariencia", icon: Palette },
  ];

  return (
    <div className="flex gap-5">
      <div className="w-60 shrink-0 bg-white rounded-xl border border-slate-200 p-2 self-start">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`w-full px-3 py-2.5 text-sm rounded-lg flex items-center gap-2 text-left transition ${tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {tab === "empresa" && (
          <Card title="Datos del taller">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Nombre del taller" defaultValue="Ambelcor · Taller de Carmen" />
              <InputField label="CIF / NIF" defaultValue="B-46123456" />
              <InputField label="Dirección" defaultValue="C/ Major, 42 – Paiporta, Valencia" />
              <InputField label="Teléfono" defaultValue="961 234 567" />
              <InputField label="Email" defaultValue="carmen@ambelcor.com" />
              <InputField label="Moneda" defaultValue="EUR (€)" />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => onToast("Datos guardados correctamente")}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2" style={{ background: BRAND }}>
                <Save className="w-4 h-4" /> Guardar cambios
              </button>
            </div>
          </Card>
        )}
        {tab === "categorias" && (
          <Card title="Categorías de artículos">
            <div className="space-y-2">
              {Object.entries(categorias).map(([k, c]) => (
                <div key={k} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: c.color + "18", color: c.color }}>
                    <c.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">{c.label}</div>
                    <div className="text-xs text-slate-500 font-mono">{k}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded border border-slate-200" style={{ background: c.color }}></div>
                    <span className="text-xs font-mono text-slate-500">{c.color}</span>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded"><Edit3 className="w-4 h-4 text-slate-500" /></button>
                  <button className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              ))}
              <button className="w-full p-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Añadir categoría
              </button>
            </div>
          </Card>
        )}
        {tab === "notificaciones" && (
          <Card title="Alertas y avisos">
            <div className="space-y-3">
              <ToggleRow label="Avisar cuando un artículo esté bajo mínimo" defaultChecked />
              <ToggleRow label="Avisar cuando falten menos de 3 unidades" defaultChecked />
              <ToggleRow label="Email diario de resumen de movimientos" />
              <ToggleRow label="Recordatorio de inventario físico mensual" defaultChecked />
              <ToggleRow label="Avisar al superar presupuesto de compra mensual" />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => onToast("Preferencias guardadas")}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2" style={{ background: BRAND }}>
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          </Card>
        )}
        {tab === "apariencia" && (
          <Card title="Apariencia y branding">
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Color principal de marca</div>
                <div className="flex items-center gap-2">
                  {[BRAND, "#0f766e", "#b8860b", "#d97706", "#059669"].map(c => (
                    <button key={c} className="w-10 h-10 rounded-lg border-2" style={{ background: c, borderColor: c === BRAND ? "#000" : "transparent" }} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Idioma</div>
                <div className="flex gap-2">
                  <Chip active>Castellano</Chip>
                  <Chip>Valencià</Chip>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Formato de fecha</div>
                <div className="flex gap-2">
                  <Chip active>DD/MM/AAAA</Chip>
                  <Chip>AAAA-MM-DD</Chip>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => onToast("Apariencia actualizada")}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2" style={{ background: BRAND }}>
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function InputField({ label, defaultValue }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</div>
      <input defaultValue={defaultValue} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
    </label>
  );
}

function ToggleRow({ label, defaultChecked }) {
  const [on, setOn] = useState(defaultChecked || false);
  return (
    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
      <span className="text-sm text-slate-700">{label}</span>
      <button onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition ${on ? "" : "bg-slate-200"}`}
        style={on ? { background: BRAND } : {}}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${on ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ============ MODAL ============
function ModalMovimiento({ tipo, articulos, proveedores, onClose, onSave }) {
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
          <FormField label="Artículo">
            <select value={art} onChange={e => setArt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              {articulos.map(a => <option key={a.id} value={a.id}>{a.id} · {a.nombre} ({fmtNum(a.stock)} {a.ud})</option>)}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={tipo === "ajuste" ? "Cantidad (+/−)" : "Cantidad"}>
              <div className="relative">
                <input type="number" value={cant} onChange={e => setCant(e.target.value)} step="0.01"
                  placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm pr-12" />
                <div className="absolute right-3 top-2.5 text-xs text-slate-400">{articulo.ud}</div>
              </div>
            </FormField>
            <FormField label={tipo === "entrada" ? "Coste por unidad (€)" : "Coste (PMP)"}>
              <input type="number" value={coste} onChange={e => setCoste(e.target.value)} step="0.01"
                placeholder={fmtNum(articulo.pmp)}
                disabled={tipo !== "entrada"}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400" />
            </FormField>
          </div>

          <FormField label={tipo === "entrada" ? "Proveedor" : tipo === "salida" ? "Encargo / Cliente" : "Motivo del ajuste"}>
            {tipo === "entrada" ? (
              <select value={origen} onChange={e => setOrigen(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
            ) : (
              <input value={origen} onChange={e => setOrigen(e.target.value)}
                placeholder={tipo === "salida" ? "Ej. Encargo Carmen García (AMB-0143)" : "Ej. Merma por corte"}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            )}
          </FormField>

          <FormField label="Referencia / Documento">
            <input value={ref} onChange={e => setRef(e.target.value)}
              placeholder={tipo === "entrada" ? "FAC-2605" : tipo === "salida" ? "AMB-0143" : "INV-0004"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </FormField>

          {cant && (
            <div className="p-3 rounded-lg border text-xs space-y-1" style={{ background: color + "10", borderColor: color + "30" }}>
              <div className="flex justify-between"><span className="text-slate-600">Stock actual:</span><span className="tabular-nums">{fmtNum(articulo.stock)} {articulo.ud}</span></div>
              <div className="flex justify-between font-semibold" style={{ color }}>
                <span>Stock tras movimiento:</span>
                <span className="tabular-nums">
                  {fmtNum(
                    articulo.stock + (tipo === "entrada" ? parseFloat(cant) : tipo === "salida" ? -parseFloat(cant) : parseFloat(cant))
                  )} {articulo.ud}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave}
            disabled={!cant}
            className="px-4 py-2 text-sm text-white rounded-lg font-semibold disabled:opacity-40"
            style={{ background: color }}>
            Confirmar {tipo}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
}

// ============ UI shared ============
function Card({ title, titleIcon: Icon, titleColor, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {title && (
        <div className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: titleColor || "#475569" }}>
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, alert, onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`bg-white rounded-xl p-4 border text-left w-full transition ${alert ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"} ${onClick ? "hover:shadow-md cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18", color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800 tabular-nums mt-2">{value}</div>
    </button>
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
