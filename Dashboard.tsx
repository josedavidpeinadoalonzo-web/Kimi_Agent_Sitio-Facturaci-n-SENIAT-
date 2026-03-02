import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Plus,
  ShoppingCart,
  Truck,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import type { ResumenDashboard } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function Dashboard() {
  const { getResumenDashboard, facturas, envios, pagos } = useApp();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);

  useEffect(() => {
    setResumen(getResumenDashboard());
  }, [facturas, getResumenDashboard]);

  // Datos para gráfico de ventas por mes
  const ventasPorMes = useMemo(() => {
    const meses: { [key: string]: number } = {};
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const key = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
      meses[key] = 0;
    }
    
    // Sumar ventas
    facturas
      .filter(f => f.tipo === 'factura' && f.estado !== 'anulada')
      .forEach(f => {
        const fecha = new Date(f.fecha);
        const key = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
        if (meses.hasOwnProperty(key)) {
          meses[key] += f.total;
        }
      });
    
    return Object.entries(meses).map(([mes, total]) => ({
      mes,
      total: Math.round(total),
    }));
  }, [facturas]);

  // Productos más vendidos
  const productosTop = useMemo(() => {
    const ventas: { [key: string]: { nombre: string; cantidad: number; total: number } } = {};
    
    facturas
      .filter(f => f.tipo === 'factura' && f.estado !== 'anulada')
      .forEach(f => {
        f.lineas.forEach(linea => {
          if (!ventas[linea.productoId]) {
            ventas[linea.productoId] = {
              nombre: linea.descripcion,
              cantidad: 0,
              total: 0,
            };
          }
          ventas[linea.productoId].cantidad += linea.cantidad;
          ventas[linea.productoId].total += linea.total;
        });
      });
    
    return Object.values(ventas)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [facturas]);

  // Estado de envíos
  const estadoEnvios = useMemo(() => {
    const estados = {
      pendiente: 0,
      preparando: 0,
      'en-camino': 0,
      entregado: 0,
      cancelado: 0,
    };
    
    envios.forEach(e => {
      if (estados.hasOwnProperty(e.estado)) {
        estados[e.estado as keyof typeof estados]++;
      }
    });
    
    return [
      { name: 'Pendiente', value: estados.pendiente, color: '#f59e0b' },
      { name: 'Preparando', value: estados.preparando, color: '#3b82f6' },
      { name: 'En Camino', value: estados['en-camino'], color: '#8b5cf6' },
      { name: 'Entregado', value: estados.entregado, color: '#10b981' },
      { name: 'Cancelado', value: estados.cancelado, color: '#ef4444' },
    ].filter(e => e.value > 0);
  }, [envios]);

  // Métodos de pago más usados
  const metodosPago = useMemo(() => {
    const metodos: { [key: string]: number } = {};
    
    pagos.forEach(p => {
      const nombre = {
        'pago-movil': 'Pago Móvil',
        'transferencia': 'Transferencia',
        'efectivo': 'Efectivo',
        'punto-venta': 'Punto de Venta',
        'zelle': 'Zelle',
        'binance': 'Binance',
      }[p.metodo] || p.metodo;
      
      metodos[nombre] = (metodos[nombre] || 0) + p.monto;
    });
    
    return Object.entries(metodos)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [pagos]);

  // Clientes top
  const clientesTop = useMemo(() => {
    const compras: { [key: string]: { nombre: string; total: number; facturas: number } } = {};
    
    facturas
      .filter(f => f.tipo === 'factura' && f.estado !== 'anulada')
      .forEach(f => {
        if (!compras[f.cliente.id]) {
          compras[f.cliente.id] = {
            nombre: f.cliente.razonSocial,
            total: 0,
            facturas: 0,
          };
        }
        compras[f.cliente.id].total += f.total;
        compras[f.cliente.id].facturas++;
      });
    
    return Object.values(compras)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [facturas]);

  // Últimas facturas
  const ultimasFacturas = useMemo(() => {
    return [...facturas]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);
  }, [facturas]);

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      maximumFractionDigits: 0,
    }).format(monto);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            {formatMonto(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!resumen) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-slate-600">
              Facturas Mes
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{resumen.totalFacturasMes}</div>
            <p className="text-xs text-slate-500">Documentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-slate-600">
              Facturado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{formatMonto(resumen.montoFacturadoMes)}</div>
            <p className="text-xs text-slate-500">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-slate-600">
              Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{resumen.totalClientes}</div>
            <p className="text-xs text-slate-500">Registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-slate-600">
              Productos
            </CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{resumen.totalProductos}</div>
            <p className="text-xs text-slate-500">Activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Link to="/facturas/nueva">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 lg:p-6">
              <Plus className="h-6 w-6 lg:h-8 lg:w-8 text-blue-200 mb-2" />
              <p className="text-blue-100 text-xs">Nueva</p>
              <h3 className="text-sm lg:text-lg font-bold">Factura</h3>
            </CardContent>
          </Card>
        </Link>

        <Link to="/clientes">
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 lg:p-6">
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-amber-200 mb-2" />
              <p className="text-amber-100 text-xs">Gestionar</p>
              <h3 className="text-sm lg:text-lg font-bold">Clientes</h3>
            </CardContent>
          </Card>
        </Link>

        <Link to="/envios">
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 lg:p-6">
              <Truck className="h-6 w-6 lg:h-8 lg:w-8 text-purple-200 mb-2" />
              <p className="text-purple-100 text-xs">Ver</p>
              <h3 className="text-sm lg:text-lg font-bold">Envíos</h3>
            </CardContent>
          </Card>
        </Link>

        <Link to="/catalogo-whatsapp">
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 lg:p-6">
              <ShoppingCart className="h-6 w-6 lg:h-8 lg:w-8 text-green-200 mb-2" />
              <p className="text-green-100 text-xs">Compartir</p>
              <h3 className="text-sm lg:text-lg font-bold">Catálogo</h3>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Ventas por mes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Ventas por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `Bs.${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Productos más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productosTop.length === 0 ? (
              <div className="h-[250px] lg:h-[300px] flex items-center justify-center text-slate-400">
                <p className="text-sm">No hay ventas registradas</p>
              </div>
            ) : (
              <div className="h-[250px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productosTop} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis 
                      dataKey="nombre" 
                      type="category" 
                      tick={{ fontSize: 10 }}
                      width={100}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} unidades`, 'Cantidad']}
                    />
                    <Bar dataKey="cantidad" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de envíos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              Estado de Envíos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadoEnvios.length === 0 ? (
              <div className="h-[200px] lg:h-[250px] flex items-center justify-center text-slate-400">
                <p className="text-sm">No hay envíos registrados</p>
              </div>
            ) : (
              <div className="h-[200px] lg:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={estadoEnvios}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {estadoEnvios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métodos de pago */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-600" />
              Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metodosPago.length === 0 ? (
              <div className="h-[200px] lg:h-[250px] flex items-center justify-center text-slate-400">
                <p className="text-sm">No hay pagos registrados</p>
              </div>
            ) : (
              <div className="h-[200px] lg:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metodosPago}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {metodosPago.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatMonto(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tablas de datos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Últimas facturas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base lg:text-lg">Últimas Facturas</CardTitle>
            <Link to="/facturas/historial">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ultimasFacturas.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No hay facturas emitidas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 text-xs font-medium text-slate-600">N°</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-slate-600">Fecha</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-slate-600 hidden sm:table-cell">Cliente</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-slate-600">Total</th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-slate-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimasFacturas.map(factura => (
                      <tr key={factura.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-2 text-sm font-medium">{factura.numero}</td>
                        <td className="py-2 px-2 text-sm text-slate-600">{formatFecha(factura.fecha)}</td>
                        <td className="py-2 px-2 text-sm hidden sm:table-cell truncate max-w-[150px]">{factura.cliente.razonSocial}</td>
                        <td className="py-2 px-2 text-sm text-right font-mono">{formatMonto(factura.total)}</td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              factura.estado === 'pagada'
                                ? 'bg-green-100 text-green-700'
                                : factura.estado === 'pendiente'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {factura.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clientes top */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Mejores Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {clientesTop.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No hay clientes con compras</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientesTop.map((cliente, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-slate-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cliente.nombre}</p>
                        <p className="text-xs text-slate-500">{cliente.facturas} facturas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-600">{formatMonto(cliente.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información legal */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-800">Información Legal</h4>
            <p className="text-sm text-amber-700 mt-1">
              Este sistema cumple con la Providencia Administrativa SNAT/2024/000102 del SENIAT.
              Asegúrese de haber obtenido la autorización correspondiente antes de emitir facturas con validez fiscal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
