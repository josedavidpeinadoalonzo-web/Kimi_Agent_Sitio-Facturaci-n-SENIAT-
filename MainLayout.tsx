import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Users,
  Package,
  FileText,
  Receipt,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  Building2,
  FlaskConical,
  Wallet,
  MessageCircle,
  Truck,
  Shield,
  Globe,
  LogOut,
  User,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { NotificationsPanel } from '@/components/NotificationsPanel';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  children?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/configuracion', label: 'Configuración', icon: Settings },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/productos', label: 'Productos', icon: Package },
  {
    path: '/produccion',
    label: 'Producción',
    icon: FlaskConical,
    children: [
      { path: '/materias-primas', label: 'Materias Primas' },
      { path: '/formulas', label: 'Fórmulas' },
      { path: '/lotes', label: 'Lotes' },
      { path: '/control-calidad', label: 'Control de Calidad' },
    ],
  },
  {
    path: '/facturas',
    label: 'Facturas',
    icon: FileText,
    children: [
      { path: '/facturas/nueva', label: 'Nueva Factura' },
      { path: '/facturas/historial', label: 'Historial' },
    ],
  },
  { path: '/pagos', label: 'Pagos', icon: Wallet },
  { path: '/envios', label: 'Envíos', icon: Truck },
  { path: '/notas', label: 'Notas D/C', icon: Receipt },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  { path: '/catalogo-whatsapp', label: 'Catálogo WhatsApp', icon: MessageCircle },
  { path: '/etiquetas', label: 'Etiquetas', icon: Tag },
  { path: '/usuarios', label: 'Usuarios', icon: Shield, adminOnly: true },
  { path: '/seniat', label: 'SENIAT', icon: Globe, adminOnly: true },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['/facturas']);
  const location = useLocation();
  const { empresa } = useApp();
  const { userData, logout, isAdmin } = useAuth();

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Filtrar items según permisos
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const renderNavItems = (items: NavItem[], isMobile: boolean = false) => {
    return items.map(item => {
      const Icon = item.icon;
      const active = isActive(item.path);
      const expanded = expandedItems.includes(item.path);

      return (
        <div key={item.path}>
          {item.children ? (
            <>
              <button
                onClick={() => (isMobile || sidebarOpen) && toggleExpand(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  active
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  !isMobile && !sidebarOpen && 'justify-center'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {(isMobile || sidebarOpen) && (
                  <>
                    <span className="flex-1 text-left text-sm truncate">{item.label}</span>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform flex-shrink-0',
                        expanded && 'rotate-90'
                      )}
                    />
                  </>
                )}
              </button>
              {(isMobile || sidebarOpen) && expanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                  {item.children.map(child => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }: { isActive: boolean }) =>
                        cn(
                          'block px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to={item.path}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  !isMobile && !sidebarOpen && 'justify-center'
                )
              }
              title={!isMobile && !sidebarOpen ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {(isMobile || sidebarOpen) && <span className="text-sm truncate">{item.label}</span>}
            </NavLink>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Overlay para móvil */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-[#1e3a5f] text-white transition-all duration-300 ease-in-out hidden lg:flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Header del Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="h-6 w-6 text-amber-400 flex-shrink-0" />
              <span className="font-bold text-sm truncate">FacturaDigital VE</span>
            </div>
          ) : (
            <Building2 className="h-6 w-6 text-amber-400 mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-white/10 flex-shrink-0"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navegación */}
        <nav className="p-2 space-y-1 overflow-y-auto flex-1">
          {renderNavItems(filteredNavItems)}
        </nav>

        {/* Footer del Sidebar - Usuario y Logout */}
        <div className="border-t border-white/10 bg-[#1e3a5f] flex-shrink-0">
          {sidebarOpen ? (
            <div className="p-4">
              {/* Info del usuario */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-amber-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-sm truncate">{userData?.nombre} {userData?.apellido}</p>
                  <p className="text-xs text-slate-400 truncate">{userData?.email}</p>
                  <Badge variant="outline" className="text-xs mt-1 border-white/20">
                    {userData?.rol === 'admin' ? 'Administrador' : 
                     userData?.rol === 'vendedor' ? 'Vendedor' :
                     userData?.rol === 'produccion' ? 'Producción' : 'Contador'}
                  </Badge>
                </div>
              </div>
              
              {/* Info de empresa */}
              {empresa && (
                <div className="text-xs text-slate-400 mb-3 pt-3 border-t border-white/10">
                  <p className="font-medium text-white truncate">{empresa.razonSocial}</p>
                  <p className="truncate">{empresa.rif}</p>
                </div>
              )}
              
              {/* Botón logout */}
              <Button 
                variant="ghost" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <div className="p-2 flex flex-col items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-slate-300 hover:text-white hover:bg-white/10"
                onClick={handleLogout}
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-[#1e3a5f] text-white transition-transform duration-300 ease-in-out lg:hidden w-64 flex flex-col',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header del Sidebar Mobile */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="h-6 w-6 text-amber-400 flex-shrink-0" />
            <span className="font-bold text-sm truncate">FacturaDigital VE</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white hover:bg-white/10 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navegación Mobile */}
        <nav className="p-2 space-y-1 overflow-y-auto flex-1">
          {renderNavItems(filteredNavItems, true)}
        </nav>

        {/* Footer del Sidebar Mobile */}
        <div className="border-t border-white/10 bg-[#1e3a5f] p-4 flex-shrink-0">
          {/* Info del usuario */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-amber-400" />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{userData?.nombre} {userData?.apellido}</p>
              <p className="text-xs text-slate-400 truncate">{userData?.email}</p>
              <Badge variant="outline" className="text-xs mt-1 border-white/20">
                {userData?.rol === 'admin' ? 'Administrador' : 
                 userData?.rol === 'vendedor' ? 'Vendedor' :
                 userData?.rol === 'produccion' ? 'Producción' : 'Contador'}
              </Badge>
            </div>
          </div>
          
          {/* Info de empresa */}
          {empresa && (
            <div className="text-xs text-slate-400 mb-3 pt-3 border-t border-white/10">
              <p className="font-medium text-white truncate">{empresa.razonSocial}</p>
              <p className="truncate">{empresa.rif}</p>
            </div>
          )}
          
          {/* Botón logout */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main
        className={cn(
          'flex-1 transition-all duration-300 min-w-0',
          'lg:ml-16',
          sidebarOpen && 'lg:ml-64'
        )}
      >
        {/* Header */}
        <header className="h-auto min-h-[4rem] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 py-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Botón menú móvil */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-slate-800">
                Sistema de Facturación
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Cumplimiento SENIAT</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Notificaciones */}
            <NotificationsPanel />
            
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-700">
                {new Date().toLocaleDateString('es-VE', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {/* Fecha compacta para móvil */}
            <div className="text-right sm:hidden">
              <p className="text-xs font-medium text-slate-700">
                {new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
