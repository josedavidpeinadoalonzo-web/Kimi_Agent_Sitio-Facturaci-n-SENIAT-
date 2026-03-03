import { useState } from 'react';
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import type { Factura } from '@/types';

export function Notas() {
  const { facturas, addFactura, configuracion } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotaDialog, setShowNotaDialog] = useState(false);
  const [tipoNota, setTipoNota] = useState<'nota-debito' | 'nota-credito'>('nota-credito');
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');

  const facturasEmitidas = facturas.filter(f => f.tipo === 'factura' && f.estado !== 'anulada');

  const filteredFacturas = facturasEmitidas.filter(
    f =>
      f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmitirNota = () => {
    if (!facturaSeleccionada) {
      toast.error('Debe seleccionar una factura');
      return;
    }
    if (!monto || parseFloat(monto) <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }
    if (!motivo.trim()) {
      toast.error('Debe indicar el motivo');
      return;
    }

    const montoNum = parseFloat(monto);
    const iva = montoNum * (configuracion.ivaGeneral / 100);

    addFactura({
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-VE'),
      cliente: facturaSeleccionada.cliente,
      lineas: [
        {
          id: crypto.randomUUID(),
          productoId: 'nota',
          codigo: 'NOTA',
          descripcion: `${tipoNota === 'nota-credito' ? 'Nota de Crédito' : 'Nota de Débito'} - ${motivo}`,
          cantidad: 1,
          precioUnitario: montoNum,
          subtotal: montoNum,
          ivaPorcentaje: configuracion.ivaGeneral,
          ivaMonto: iva,
          total: montoNum + iva,
        },
      ],
      subtotal: montoNum,
      descuento: 0,
      baseImponible: montoNum,
      iva,
      total: montoNum + iva,
      estado: 'emitida',
      tipo: tipoNota,
      facturaRelacionada: facturaSeleccionada.id,
      motivoNota: motivo,
    });

    toast.success(`${tipoNota === 'nota-credito' ? 'Nota de Crédito' : 'Nota de Débito'} emitida correctamente`);
    setShowNotaDialog(false);
    setFacturaSeleccionada(null);
    setMonto('');
    setMotivo('');
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notas de Débito y Crédito</h1>
          <p className="text-slate-500">Emita notas para corregir facturas</p>
        </div>
      </div>

      {/* Información */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">Corrección de Facturas</h4>
            <p className="text-sm text-amber-700 mt-1">
              Las notas de débito y crédito permiten corregir facturas emitidas sin modificar el documento original.
              Según la Providencia SNAT/2024/000102, toda corrección debe realizarse mediante estos documentos.
            </p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:border-red-300 transition-colors"
          onClick={() => {
            setTipoNota('nota-debito');
            setShowNotaDialog(true);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowUpCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nota de Débito</h3>
                <p className="text-sm text-slate-500">Aumentar el monto de una factura</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-green-300 transition-colors"
          onClick={() => {
            setTipoNota('nota-credito');
            setShowNotaDialog(true);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowDownCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nota de Crédito</h3>
                <p className="text-sm text-slate-500">Disminuir o anular una factura</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facturas para seleccionar */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccione una Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar factura por número o cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Número</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Cliente</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredFacturas.slice(0, 10).map(factura => (
                  <tr
                    key={factura.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                      facturaSeleccionada?.id === factura.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setFacturaSeleccionada(factura)}
                  >
                    <td className="py-3 px-4 text-sm font-medium">{factura.numero}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatFecha(factura.fecha)}</td>
                    <td className="py-3 px-4 text-sm">{factura.cliente.razonSocial}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      {formatMonto(factura.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {facturaSeleccionada?.id === factura.id && (
                        <div className="h-4 w-4 rounded-full bg-blue-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para emitir nota */}
      <Dialog open={showNotaDialog} onOpenChange={setShowNotaDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {tipoNota === 'nota-credito' ? 'Emitir Nota de Crédito' : 'Emitir Nota de Débito'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {facturaSeleccionada ? (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Factura: {facturaSeleccionada.numero}</p>
                <p className="text-sm text-slate-600">{facturaSeleccionada.cliente.razonSocial}</p>
                <p className="text-sm text-slate-600">
                  Total original: {formatMonto(facturaSeleccionada.total)}
                </p>
              </div>
            ) : (
              <p className="text-amber-600 text-sm">Seleccione una factura de la lista</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="monto">
                Monto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">
                Motivo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Indique el motivo de la corrección"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEmitirNota}>
              Emitir {tipoNota === 'nota-credito' ? 'Nota de Crédito' : 'Nota de Débito'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
