import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import PageWrapper from '@/components/layout/PageWrapper'

// Auth
import Login from '@/pages/Login'
import Setup2FA from '@/pages/Setup2FA'
import Verify2FA from '@/pages/Verify2FA'
import Acceso from '@/pages/Acceso/Acceso'

// CRM
import EncargosLista from '@/pages/Encargos/EncargosLista'
import NuevoEncargo from '@/pages/Encargos/NuevoEncargo'
import EncargoDetalle from '@/pages/Encargos/EncargoDetalle'

// Clientes
import NuevoCliente from '@/pages/Clientes/NuevoCliente'
import ClienteDetalle from '@/pages/Clientes/ClienteDetalle'
import MedidasCliente from '@/pages/Clientes/MedidasCliente'


// Contabilidad
import ContabilidadDashboard from '@/pages/Contabilidad/ContabilidadDashboard'

// Inventario
import MaterialesLista from '@/pages/Inventario/MaterialesLista'
import NuevoMaterial from '@/pages/Inventario/NuevoMaterial'
import MaterialDetalle from '@/pages/Inventario/MaterialDetalle'

// Catálogo
import CatalogoForm from '@/pages/Catalogo/CatalogoForm'

// Seguimiento público
import SeguimientoForm from '@/pages/Seguimiento/SeguimientoForm'
import SeguimientoDetalle from '@/pages/Seguimiento/SeguimientoDetalle'

// Ajustes
import Ajustes from '@/pages/Ajustes/Ajustes'

// Landing pública (Web Pública, enlazada desde el menú del CRM)
import Landing from '@landing/Landing'

const Placeholder = ({ title }) => (
  <PageWrapper>
    <div className="p-8 text-center text-[--text-light]">
      <h2 className="font-display text-2xl mb-2">{title}</h2>
      <p className="text-sm">Próximamente</p>
    </div>
  </PageWrapper>
)

const Protected = ({ children, permiso }) => (
  <ProtectedRoute permiso={permiso}>{children}</ProtectedRoute>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/setup-2fa" element={<Setup2FA />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />
        <Route path="/acceso" element={<Acceso />} />
        <Route path="/seguimiento" element={<SeguimientoForm />} />
        <Route path="/seguimiento/:token" element={<SeguimientoDetalle />} />
        <Route path="/web-publica" element={<Landing />} />

        {/* Rutas protegidas */}
        <Route path="/encargos" element={<Protected><EncargosLista /></Protected>} />
        <Route path="/encargos/nuevo" element={<Protected><NuevoEncargo /></Protected>} />
        <Route path="/encargos/:id" element={<Protected><EncargoDetalle /></Protected>} />

        <Route path="/clientes" element={<Navigate to="/encargos?tab=clientes" replace />} />
        <Route path="/clientes/nuevo" element={<Protected><NuevoCliente /></Protected>} />
        <Route path="/clientes/:id" element={<Protected><ClienteDetalle /></Protected>} />
        <Route path="/clientes/:id/medidas" element={<Protected><MedidasCliente /></Protected>} />


        <Route path="/inventario" element={<Protected><MaterialesLista /></Protected>} />
        <Route path="/inventario/nuevo" element={<Protected><NuevoMaterial /></Protected>} />
        <Route path="/inventario/ajustes" element={<Navigate to="/ajustes" replace />} />
        <Route path="/inventario/proveedores" element={<Navigate to="/inventario?tab=proveedores" replace />} />
        <Route path="/inventario/:id" element={<Protected><MaterialDetalle /></Protected>} />

        <Route path="/catalogo" element={<Navigate to="/encargos?tab=catalogo" replace />} />
        <Route path="/catalogo/nueva" element={<Protected><CatalogoForm /></Protected>} />
        <Route path="/catalogo/:id" element={<Protected><CatalogoForm /></Protected>} />

        <Route path="/contabilidad" element={<Protected permiso="contabilidad"><ContabilidadDashboard /></Protected>} />

        <Route path="/citas" element={<Navigate to="/encargos?tab=citas" replace />} />

        <Route path="/ajustes" element={<Protected permiso="ajustes"><Ajustes /></Protected>} />

        <Route path="/admin" element={<Protected><Placeholder title="Administración" /></Protected>} />

        <Route path="/" element={<Navigate to="/encargos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
