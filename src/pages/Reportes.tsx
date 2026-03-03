import { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';

export function Reportes() {
  const { facturas, clientes, productos, getLibroVentas } = useApp();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Calcular estadísticas
  const facturasEmitidas = facturas.filter(f => f.tipo === 'factura');
  const totalFacturado = facturasEmitidas.reduce((sum, f) => sum + f.total, 0);
  const totalIVA = facturasEmitidas.reduce((sum, f) => sum + f.iva, 0);
  const promedioFactura = facturasEmitidas.length > 0 ? totalFacturado / facturasEmitidas.length : 0;

  // Facturas del mes actual
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const facturasMes = facturasEmitidas.filter(f => new Date(f.fecha) >= inicioMes);
  const totalMes = facturasMes.reduce((sum, f) => sum + f.total, 0);

  const handleExportarLibroVentas = () => {
    if (!fechaInicio || !fechaFin) {
      alert('Debe seleccionar un rango de fechas');
      return;
    }

    const data = getLibroVentas(fechaInicio, fechaFin);
    
    // Crear CSV
    const headers = ['Fecha', 'Número', 'Control', 'Cliente', 'RIF', 'Base Imponible', 'IVA', 'Total', 'Estado'];
    const rows = data.map(f => [
      f.fecha,
      f.numero,
      f.numeroControl,
      f.cliente.razonSocial,
      f.cliente.rif,
      f.baseImponible.toFixed(2),
      f.iva.toFixed(2),
      f.total.toFixed(2),
      f.estado,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Libro_Ventas_${fechaInicio}_${fechaFin}.csv`;
    link.click();
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes y Estadísticas</h1>
          <p className="text-slate-500">Analice el desempeño de su negocio</p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Facturado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMonto(totalFacturado)}</div>
            <p className="text-xs text-slate-500">Desde el inicio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total IVA
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMonto(totalIVA)}</div>
            <p className="text-xs text-slate-500">IVA recaudado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Facturas Emitidas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facturasEmitidas.length}</div>
            <p className="text-xs text-slate-500">Documentos fiscales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Promedio por Factura
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMonto(promedioFactura)}</div>
            <p className="text-xs text-slate-500">Monto promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen del mes */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Resumen del Mes Actual</p>
              <h3 className="text-3xl font-bold mt-1">{formatMonto(totalMes)}</h3>
              <p className="text-blue-100 text-sm mt-1">
                {facturasMes.length} facturas emitidas
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Libro de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Libro de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Genere el Libro de Ventas en formato CSV para su declaración ante el SENIAT.
            Este reporte incluye todas las facturas emitidas en el período seleccionado.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleExportarLibroVentas} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clientes.length}</div>
            <p className="text-sm text-slate-500">Clientes registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{productos.filter(p => p.activo).length}</div>
            <p className="text-sm text-slate-500">Productos activos en el catálogo</p>
          </CardContent>
        </Card>
      </div>

      {/* Nota legal */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          <strong>Nota:</strong> Los reportes generados por este sistema son para fines informativos.
          Para la declaración ante el SENIAT, asegúrese de cumplir con todos los requisitos establecidos
          en la Providencia Administrativa SNAT/2024/000102.
        </p>
      </div>
    </div>
  );
}
