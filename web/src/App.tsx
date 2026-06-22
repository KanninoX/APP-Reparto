import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PedidosPage from './pages/PedidosPage';
import ClientesPage from './pages/ClientesPage';
import RutasPage from './pages/RutasPage';
import MapaPage from './pages/MapaPage';
import UsuariosPage from './pages/UsuariosPage';
import FacturasPage from './pages/FacturasPage';
import VehiculosPage from './pages/VehiculosPage';
import Layout from './components/Layout';
import OperarioLayout from './pages/operario/OperarioLayout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialized } = useAuth();
  if (!initialized) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Redirige al operario a su vista móvil y al resto al dashboard
function HomeRedirect() {
  const { user } = useAuth();
  return user?.rol === 'OPERARIO'
    ? <Navigate to="/operario" replace />
    : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Vista móvil del operario */}
      <Route path="/operario" element={<PrivateRoute><OperarioLayout /></PrivateRoute>} />

      {/* Panel web (admin / ejecutivo) */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="rutas" element={<RutasPage />} />
        <Route path="mapa" element={<MapaPage />} />
        <Route path="facturas" element={<FacturasPage />} />
        <Route path="vehiculos" element={<VehiculosPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
