import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import PageWrapper from '@/components/layout/PageWrapper'

// Auth
import Login from '@/pages/Login'
import Setup2FA from '@/pages/Setup2FA'
import Verify2FA from '@/pages/Verify2FA'

// CRM
import EncargosLista from '@/pages/Encargos/EncargosLista'
import NuevoEncargo from '@/pages/Encargos/NuevoEncargo'
import EncargoDetalle from '@/pages/Encargos/EncargoDetalle'
import Cronograma from '@/pages/Cronograma/Cronograma'

// Clientes
import ClientesLista from '@/pages/Clientes/ClientesLista'
import NuevoCliente from '@/pages/Clientes/NuevoCliente'
import ClienteDetalle from '@/pages/Clientes/ClienteDetalle'
import MedidasCliente from '@/pages/Clientes/MedidasCliente'

// Proveedores
import ProveedoresLista from '@/pages/Proveedores/ProveedoresLista'
import NuevoProveedor from '@/pages/Proveedores/NuevoProveedor'
import ProveedorDetalle from '@/pages/Proveedores/ProveedorDetalle'

// Contabilidad
import ContabilidadDashboard from '@/pages/Contabilidad/ContabilidadDashboard'
import CobrosList from '@/pages/Contabilidad/CobrosList'
import PagosList from '@/pages/Contabilidad/PagosList'
import Reportes from '@/pages/Contabilidad/Reportes'

// Inventario
import MaterialesLista from '@/pages/Inventario/MaterialesLista'
import NuevoMaterial from '@/pages/Inventario/NuevoMaterial'
import MaterialDetalle from '@/pages/Inventario/MaterialDetalle'
import InventarioPr from '@/pages/Inventario/ambelcor-inventario-v2'

// Catálogo
import CatalogoLista from '@/pages/Catalogo/CatalogoLista'
import CatalogoForm from '@/pages/Catalogo/CatalogoForm'

// Seguimiento público
import SeguimientoForm from '@/pages/Seguimiento/SeguimientoForm'
import SeguimientoDetalle from '@/pages/Seguimiento/SeguimientoDetalle'

const Placeholder = ({ title }) => (
  <PageWrapper>
    <div className="p-8 text-center text-[--text-light]">
      <h2 className="font-display text-2xl mb-2">{title}</h2>
      <p className="text-sm">Próximamente</p>
    </div>
  </PageWrapper>
)

const Protected = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/setup-2fa" element={<Setup2FA />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />
        <Route path="/seguimiento" element={<SeguimientoForm />} />
        <Route path="/seguimiento/:token" element={<SeguimientoDetalle />} />

        {/* Rutas protegidas */}
        <Route path="/encargos" element={<Protected><EncargosLista /></Protected>} />
        <Route path="/encargos/nuevo" element={<Protected><NuevoEncargo /></Protected>} />
        <Route path="/encargos/:id" element={<Protected><EncargoDetalle /></Protected>} />

        <Route path="/clientes" element={<Protected><ClientesLista /></Protected>} />
        <Route path="/clientes/nuevo" element={<Protected><NuevoCliente /></Protected>} />
        <Route path="/clientes/:id" element={<Protected><ClienteDetalle /></Protected>} />
        <Route path="/clientes/:id/medidas" element={<Protected><MedidasCliente /></Protected>} />

        <Route path="/proveedores" element={<Protected><ProveedoresLista /></Protected>} />
        <Route path="/proveedores/nuevo" element={<Protected><NuevoProveedor /></Protected>} />
        <Route path="/proveedores/:id" element={<Protected><ProveedorDetalle /></Protected>} />

        <Route path="/inventario" element={<Protected><MaterialesLista /></Protected>} />
        <Route path="/inventario/nuevo" element={<Protected><NuevoMaterial /></Protected>} />
        <Route path="/inventario/:id" element={<Protected><MaterialDetalle /></Protected>} />
        <Route path="/inventario-pr" element={<Protected><InventarioPr /></Protected>} />
        <Route path="/cronograma" element={<Protected><Cronograma /></Protected>} />

        <Route path="/catalogo" element={<Protected><CatalogoLista /></Protected>} />
        <Route path="/catalogo/nueva" element={<Protected><CatalogoForm /></Protected>} />
        <Route path="/catalogo/:id" element={<Protected><CatalogoForm /></Protected>} />

        <Route path="/contabilidad" element={<Protected><ContabilidadDashboard /></Protected>} />
        <Route path="/contabilidad/cobros" element={<Protected><CobrosList /></Protected>} />
        <Route path="/contabilidad/pagos" element={<Protected><PagosList /></Protected>} />
        <Route path="/contabilidad/reportes" element={<Protected><Reportes /></Protected>} />

        <Route path="/admin" element={<Protected><Placeholder title="Administración" /></Protected>} />

        <Route path="/" element={<Navigate to="/encargos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
