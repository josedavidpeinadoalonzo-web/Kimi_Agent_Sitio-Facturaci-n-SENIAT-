import { useState } from 'react';
import { Plus, Search, Trash2, Wallet, CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import type { Pago, MetodoPago } from '@/types';

const metodosPago: { value: MetodoPago; label: string; icon: React.ElementType }[] = [
  { value: 'pago-movil', label: 'Pago Móvil', icon: Smartphone },
  { value: 'transferencia', label: 'Transferencia', icon: CreditCard },
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'punto-venta', label: 'Punto de Venta', icon: CreditCard },
  { value: 'zelle', label: 'Zelle', icon: CreditCard },
  { value: 'binance', label: 'Binance Pay', icon: Wallet },
];

export function Pagos() {
  const { pagos, facturas, addPago, deletePago, getSaldoPendiente, configuracion } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    facturaId: '',
    monto: 0,
    metodo: 'pago-movil' as MetodoPago,
    referencia: '',
    banco: '',
    telefono: '',
    notas: '',
  });

  const filteredPagos = pagos.filter(p => {
    const factura = facturas.find(f => f.id === p.facturaId);
    const matchesSearch = 
      factura?.numero.includes(searchTerm) ||
      factura?.cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referencia?.includes(searchTerm);
    const matchesMetodo = filtroMetodo === 'todos' || p.metodo === filtroMetodo;
    return matchesSearch && matchesMetodo;
  });

  // Estadísticas
  const totalRecaudado = pagos.reduce((sum, p) => sum + p.monto, 0);
  const pagosHoy = pagos.filter(p => p.fecha === new Date().toISOString().split('T')[0]).reduce((sum, p) => sum + p.monto, 0);
  const facturasPendientes = facturas.filter(f => getSaldoPendiente(f.id) > 0).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const factura = facturas.find(f => f.id === formData.facturaId);
    if (!factura) {
      toast.error('Seleccione una factura');
      return;
    }

    const saldo = getSaldoPendiente(factura.id);
    if (formData.monto > saldo) {
      toast.error(`El monto excede el saldo pendiente (${formatMonto(saldo)})`);
      return;
    }

    addPago({
      ...formData,
      fecha: new Date().toISOString().split('T')[0],
    });

    toast.success('Pago registrado correctamente');
    setIsDialogOpen(false);
    setFormData({
      facturaId: '',
      monto: 0,
      metodo: 'pago-movil',
      referencia: '',
      banco: '',
      telefono: '',
      notas: '',
    });
  };

  const handleDelete = (pago: Pago) => {
    if (confirm('¿Eliminar este pago?')) {
      deletePago(pago.id);
      toast.success('Pago eliminado');
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  const getMetodoLabel = (metodo: string) => {
    return metodosPago.find(m => m.value === metodo)?.label || metodo;
  };

  const getMetodoIcon = (metodo: string) => {
    const Icon = metodosPago.find(m => m.value === metodo)?.icon || Wallet;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Registro de Pagos</h1>
          <p className="text-slate-500">Control de cobros y métodos de pago</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Pago
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Recaudado</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMonto(totalRecaudado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Recaudado Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatMonto(pagosHoy)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Facturas Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{facturasPendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pagos</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{pagos.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Datos de pago de la empresa */}
      {(configuracion.datosPagoMovil || configuracion.datosTransferencia) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Tus Datos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configuracion.datosPagoMovil && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-slate-800 flex items-center gap-2 mb-2">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    Pago Móvil
                  </h4>
                  <p className="text-sm text-slate-600">Banco: {configuracion.datosPagoMovil.banco}</p>
                  <p className="text-sm text-slate-600">Teléfono: {configuracion.datosPagoMovil.telefono}</p>
                  <p className="text-sm text-slate-600">Documento: {configuracion.datosPagoMovil.documento}</p>
                </div>
              )}
              {configuracion.datosTransferencia && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-slate-800 flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    Transferencia
                  </h4>
                  <p className="text-sm text-slate-600">Banco: {configuracion.datosTransferencia.banco}</p>
                  <p className="text-sm text-slate-600">Cuenta: {configuracion.datosTransferencia.cuenta}</p>
                  <p className="text-sm text-slate-600">Titular: {configuracion.datosTransferencia.titular}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar pago..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los métodos</SelectItem>
                  {metodosPago.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos ({filteredPagos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPagos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Wallet className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Factura</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Método</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Monto</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPagos.map(pago => {
                    const factura = facturas.find(f => f.id === pago.facturaId);
                    return (
                      <tr key={pago.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm">{new Date(pago.fecha).toLocaleDateString('es-VE')}</td>
                        <td className="py-3 px-4 text-sm font-mono">{factura?.numero}</td>
                        <td className="py-3 px-4 text-sm">{factura?.cliente.razonSocial}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="flex items-center gap-2">
                            {getMetodoIcon(pago.metodo)}
                            {getMetodoLabel(pago.metodo)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-mono font-medium text-green-600">
                          {formatMonto(pago.monto)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(pago)} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Factura *</Label>
                <Select
                  value={formData.facturaId}
                  onValueChange={(v) => setFormData({ ...formData, facturaId: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar factura pendiente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {facturas
                      .filter(f => getSaldoPendiente(f.id) > 0)
                      .map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.numero} - {f.cliente.razonSocial} (Saldo: {formatMonto(getSaldoPendiente(f.id))})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monto}
                    onChange={e => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pago *</Label>
                  <Select
                    value={formData.metodo}
                    onValueChange={(v) => setFormData({ ...formData, metodo: v as MetodoPago })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metodosPago.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Referencia / Últimos Dígitos</Label>
                <Input
                  value={formData.referencia}
                  onChange={e => setFormData({ ...formData, referencia: e.target.value })}
                  placeholder="Número de referencia, confirmación, etc."
                />
              </div>

              {formData.metodo === 'pago-movil' && (
                <div className="space-y-2">
                  <Label>Teléfono del Cliente</Label>
                  <Input
                    value={formData.telefono}
                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="0414-1234567"
                  />
                </div>
              )}

              {formData.metodo === 'transferencia' && (
                <div className="space-y-2">
                  <Label>Banco Emisor</Label>
                  <Input
                    value={formData.banco}
                    onChange={e => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Banco de Venezuela, Banesco, etc."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas</Label>
                <textarea
                  value={formData.notas}
                  onChange={e => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
