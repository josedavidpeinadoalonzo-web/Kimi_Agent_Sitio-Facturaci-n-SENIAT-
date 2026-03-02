import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Configuracion } from '@/pages/Configuracion';
import { Clientes } from '@/pages/Clientes';
import { Productos } from '@/pages/Productos';
import { MateriasPrimas } from '@/pages/MateriasPrimas';
import { Formulas } from '@/pages/Formulas';
import { Lotes } from '@/pages/Lotes';
import { ControlCalidad } from '@/pages/ControlCalidad';
import { Pagos } from '@/pages/Pagos';
import { NuevaFactura } from '@/pages/NuevaFactura';
import { HistorialFacturas } from '@/pages/HistorialFacturas';
import { Notas } from '@/pages/Notas';
import { Reportes } from '@/pages/Reportes';
import { CatalogoWhatsApp } from '@/pages/CatalogoWhatsApp';
import { Envios } from '@/pages/Envios';
import { Login } from '@/pages/Login';
import { Usuarios } from '@/pages/Usuarios';
import { SeniatIntegration } from '@/pages/SeniatIntegration';
import { Etiquetas } from '@/pages/Etiquetas';
import { Loader2 } from 'lucide-react';

// Componente de carga
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#1e3a5f]" />
        <p className="text-slate-600">Cargando...</p>
      </div>
    </div>
  );
}

// Ruta protegida que verifica autenticación
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Ruta pública (solo accesible si NO está autenticado)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta pública - Login */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* Rutas protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/materias-primas" element={<MateriasPrimas />} />
                <Route path="/formulas" element={<Formulas />} />
                <Route path="/lotes" element={<Lotes />} />
                <Route path="/control-calidad" element={<ControlCalidad />} />
                <Route path="/pagos" element={<Pagos />} />
                <Route path="/facturas/nueva" element={<NuevaFactura />} />
                <Route path="/facturas/historial" element={<HistorialFacturas />} />
                <Route path="/notas" element={<Notas />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/catalogo-whatsapp" element={<CatalogoWhatsApp />} />
                <Route path="/envios" element={<Envios />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/seniat" element={<SeniatIntegration />} />
                <Route path="/etiquetas" element={<Etiquetas />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
