import { useState, useMemo } from 'react';
import { 
  Bell, 
  X, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/context/AppContext';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'stock' | 'vencimiento' | 'envio' | 'pago' | 'general';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  date: string;
  read: boolean;
  actionLink?: string;
  actionLabel?: string;
}

export function NotificationsPanel() {
  const { 
    productos, 
    materiasPrimas, 
    lotes, 
    envios, 
    facturas,
    getSaldoPendiente 
  } = useApp();
  
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    const stored = localStorage.getItem('seniat_notifications_read');
    return stored ? JSON.parse(stored) : [];
  });

  // Generar notificaciones automáticamente
  const notifications = useMemo<Notification[]>(() => {
    const notifs: Notification[] = [];
    const hoy = new Date();

    // 1. Productos con stock bajo
    productos
      .filter(p => p.activo && p.stock !== undefined && p.stock <= 10)
      .forEach(p => {
        notifs.push({
          id: `stock-prod-${p.id}`,
          type: 'stock',
          title: 'Stock Bajo',
          message: `${p.descripcion} tiene solo ${p.stock} unidades en stock`,
          severity: p.stock === 0 ? 'high' : 'medium',
          date: hoy.toISOString(),
          read: readNotifications.includes(`stock-prod-${p.id}`),
          actionLink: '/productos',
          actionLabel: 'Ver Productos',
        });
      });

    // 2. Materias primas con stock bajo
    materiasPrimas
      .filter(mp => mp.stock <= 100)
      .forEach(mp => {
        notifs.push({
          id: `stock-mp-${mp.id}`,
          type: 'stock',
          title: 'Materia Prima con Stock Bajo',
          message: `${mp.nombre} tiene ${mp.stock} ${mp.unidad} en stock`,
          severity: mp.stock <= 50 ? 'high' : 'medium',
          date: hoy.toISOString(),
          read: readNotifications.includes(`stock-mp-${mp.id}`),
          actionLink: '/materias-primas',
          actionLabel: 'Ver Inventario',
        });
      });

    // 3. Productos/Lotes próximos a vencer
    const diasAlerta = 30;
    lotes.forEach(lote => {
      if (lote.fechaVencimiento && lote.estado !== 'dispersado') {
        const fechaVenc = new Date(lote.fechaVencimiento);
        const diasDiff = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasDiff <= diasAlerta && diasDiff >= 0) {
          notifs.push({
            id: `venc-lote-${lote.id}`,
            type: 'vencimiento',
            title: 'Lote Próximo a Vencer',
            message: `${lote.nombreProducto} (Lote: ${lote.codigo}) vence en ${diasDiff} días`,
            severity: diasDiff <= 7 ? 'high' : 'medium',
            date: hoy.toISOString(),
            read: readNotifications.includes(`venc-lote-${lote.id}`),
            actionLink: '/lotes',
            actionLabel: 'Ver Lotes',
          });
        }
      }
    });

    // 4. Materias primas próximas a vencer
    materiasPrimas
      .filter(mp => mp.fechaVencimiento)
      .forEach(mp => {
        const fechaVenc = new Date(mp.fechaVencimiento!);
        const diasDiff = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasDiff <= diasAlerta && diasDiff >= 0) {
          notifs.push({
            id: `venc-mp-${mp.id}`,
            type: 'vencimiento',
            title: 'Materia Prima por Vencer',
            message: `${mp.nombre} vence en ${diasDiff} días`,
            severity: diasDiff <= 7 ? 'high' : 'medium',
            date: hoy.toISOString(),
            read: readNotifications.includes(`venc-mp-${mp.id}`),
            actionLink: '/materias-primas',
            actionLabel: 'Ver Inventario',
          });
        }
      });

    // 5. Envíos pendientes (más de 24 horas)
    envios
      .filter(e => e.estado === 'pendiente')
      .forEach(envio => {
        const fechaEnvio = new Date(envio.fechaEnvio);
        const horasDiff = Math.ceil((hoy.getTime() - fechaEnvio.getTime()) / (1000 * 60 * 60));
        
        if (horasDiff >= 24) {
          notifs.push({
            id: `envio-${envio.id}`,
            type: 'envio',
            title: 'Envío Pendiente',
            message: `El envío de la factura ${envio.numeroFactura} lleva ${Math.floor(horasDiff / 24)} días sin preparar`,
            severity: 'medium',
            date: hoy.toISOString(),
            read: readNotifications.includes(`envio-${envio.id}`),
            actionLink: '/envios',
            actionLabel: 'Ver Envíos',
          });
        }
      });

    // 6. Envíos en camino (más de 48 horas)
    envios
      .filter(e => e.estado === 'en-camino')
      .forEach(envio => {
        const fechaEnvio = new Date(envio.fechaEnvio);
        const horasDiff = Math.ceil((hoy.getTime() - fechaEnvio.getTime()) / (1000 * 60 * 60));
        
        if (horasDiff >= 48) {
          notifs.push({
            id: `envio-camino-${envio.id}`,
            type: 'envio',
            title: 'Envío en Camino Demorado',
            message: `El envío de la factura ${envio.numeroFactura} lleva ${Math.floor(horasDiff / 24)} días en tránsito`,
            severity: horasDiff >= 72 ? 'high' : 'medium',
            date: hoy.toISOString(),
            read: readNotifications.includes(`envio-camino-${envio.id}`),
            actionLink: '/envios',
            actionLabel: 'Ver Envíos',
          });
        }
      });

    // 7. Facturas pendientes de pago (más de 7 días)
    facturas
      .filter(f => f.tipo === 'factura' && f.estado === 'pendiente')
      .forEach(factura => {
        const saldo = getSaldoPendiente(factura.id);
        if (saldo > 0) {
          const fechaFactura = new Date(factura.fecha);
          const diasDiff = Math.ceil((hoy.getTime() - fechaFactura.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diasDiff >= 7) {
            notifs.push({
              id: `pago-${factura.id}`,
              type: 'pago',
              title: 'Factura Pendiente de Pago',
              message: `La factura ${factura.numero} de ${factura.cliente.razonSocial} tiene un saldo pendiente de ${new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(saldo)}`,
              severity: diasDiff >= 15 ? 'high' : 'medium',
              date: hoy.toISOString(),
              read: readNotifications.includes(`pago-${factura.id}`),
              actionLink: '/facturas/historial',
              actionLabel: 'Ver Facturas',
            });
          }
        }
      });

    // Ordenar por severidad y fecha
    return notifs.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [productos, materiasPrimas, lotes, envios, facturas, getSaldoPendiente, readNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    const newRead = [...readNotifications, id];
    setReadNotifications(newRead);
    localStorage.setItem('seniat_notifications_read', JSON.stringify(newRead));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(allIds);
    localStorage.setItem('seniat_notifications_read', JSON.stringify(allIds));
  };

  const clearRead = () => {
    setReadNotifications([]);
    localStorage.removeItem('seniat_notifications_read');
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'stock':
        return <Package className="h-4 w-4" />;
      case 'vencimiento':
        return <Calendar className="h-4 w-4" />;
      case 'envio':
        return <Truck className="h-4 w-4" />;
      case 'pago':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Marcar todo
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-sm">No hay notificaciones pendientes</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Todo está en orden
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-slate-50 transition-colors ${
                        !notif.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(notif.severity)}`}>
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{notif.title}</h4>
                            {!notif.read && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Hoy
                            </span>
                            <div className="flex items-center gap-2">
                              {notif.actionLink && (
                                <Link to={notif.actionLink} onClick={() => setIsOpen(false)}>
                                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                    {notif.actionLabel}
                                  </Button>
                                </Link>
                              )}
                              {!notif.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto py-1 px-2 text-xs"
                                  onClick={() => markAsRead(notif.id)}
                                >
                                  Marcar leída
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {readNotifications.length > 0 && (
              <div className="p-3 border-t bg-slate-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-slate-500"
                  onClick={clearRead}
                >
                  Limpiar historial de leídas
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
