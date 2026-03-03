import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Truck, Package, MapPin, Phone, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import type { Envio } from '@/types';

const metodosEnvio = [
  { value: 'delivery-propio', label: 'Delivery Propio', icon: Truck },
  { value: 'motorizado', label: 'Motorizado', icon: Truck },
  { value: 'transporte', label: 'Transporte', icon: Truck },
  { value: 'retiro-tienda', label: 'Retiro en Tienda', icon: Package },
];

const estadosEnvio = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'preparando', label: 'Preparando', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'en-camino', label: 'En Camino', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'entregado', label: 'Entregado', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'devuelto', label: 'Devuelto', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const zonasDelivery = [
  'Centro',
  'Norte',
  'Sur',
  'Este',
  'Oeste',
  'Zona Industrial',
  'Otro',
];

export function Envios() {
  const { envios, facturas, addEnvio, updateEnvio, deleteEnvio } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnvio, setEditingEnvio] = useState<Envio | null>(null);
  const [formData, setFormData] = useState({
    facturaId: '',
    fechaEnvio: new Date().toISOString().split('T')[0],
    fechaEntregaEstimada: '',
    metodo: 'delivery-propio' as Envio['metodo'],
    transportista: '',
    telefonoTransportista: '',
    costoEnvio: 0,
    estado: 'pendiente' as Envio['estado'],
    direccionEntrega: '',
    zona: '',
    notas: '',
    referencia: '',
    trackingCode: '',
  });

  // Filtrar facturas que no tienen envío asignado (para nuevos envíos)
  const facturasSinEnvio = facturas.filter(f => 
    f.tipo === 'factura' && 
    f.estado !== 'anulada' && 
    !envios.some(e => e.facturaId === f.id)
  );

  const filteredEnvios = envios.filter(envio => {
    const matchesSearch = 
      envio.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.transportista?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.trackingCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filtroEstado === 'todos' || envio.estado === filtroEstado;
    return matchesSearch && matchesEstado;
  });

  // Estadísticas
  const enviosPendientes = envios.filter(e => e.estado === 'pendiente').length;
  const enviosEnCamino = envios.filter(e => e.estado === 'en-camino').length;
  const enviosEntregadosHoy = envios.filter(e => {
    if (e.estado !== 'entregado' || !e.fechaEntregaReal) return false;
    const hoy = new Date().toISOString().split('T')[0];
    return e.fechaEntregaReal === hoy;
  }).length;
  const totalCostoEnvios = envios.reduce((sum, e) => sum + (e.costoEnvio || 0), 0);

  const handleOpenDialog = (envio?: Envio) => {
    if (envio) {
      setEditingEnvio(envio);
      setFormData({
        facturaId: envio.facturaId,
        fechaEnvio: envio.fechaEnvio,
        fechaEntregaEstimada: envio.fechaEntregaEstimada || '',
        metodo: envio.metodo,
        transportista: envio.transportista || '',
        telefonoTransportista: envio.telefonoTransportista || '',
        costoEnvio: envio.costoEnvio || 0,
        estado: envio.estado,
        direccionEntrega: envio.direccionEntrega,
        zona: envio.zona || '',
        notas: envio.notas || '',
        referencia: envio.referencia || '',
        trackingCode: envio.trackingCode || '',
      });
    } else {
      setEditingEnvio(null);
      setFormData({
        facturaId: '',
        fechaEnvio: new Date().toISOString().split('T')[0],
        fechaEntregaEstimada: '',
        metodo: 'delivery-propio',
        transportista: '',
        telefonoTransportista: '',
        costoEnvio: 0,
        estado: 'pendiente',
        direccionEntrega: '',
        zona: '',
        notas: '',
        referencia: '',
        trackingCode: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.facturaId) {
      toast.error('Debe seleccionar una factura');
      return;
    }

    const factura = facturas.find(f => f.id === formData.facturaId);
    if (!factura) {
      toast.error('Factura no encontrada');
      return;
    }

    const envioData = {
      ...formData,
      numeroFactura: factura.numero,
      cliente: {
        id: factura.cliente.id,
        nombre: factura.cliente.razonSocial,
        telefono: factura.cliente.telefono,
        direccion: factura.cliente.direccion,
      },
    };

    if (editingEnvio) {
      updateEnvio(editingEnvio.id, envioData);
      toast.success('Envío actualizado correctamente');
    } else {
      addEnvio(envioData);
      toast.success('Envío registrado correctamente');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (envio: Envio) => {
    if (confirm(`¿Eliminar el envío de la factura ${envio.numeroFactura}?`)) {
      deleteEnvio(envio.id);
      toast.success('Envío eliminado');
    }
  };

  const handleCambiarEstado = (envio: Envio, nuevoEstado: Envio['estado']) => {
    const updates: Partial<Envio> = { estado: nuevoEstado };
    
    if (nuevoEstado === 'entregado') {
      updates.fechaEntregaReal = new Date().toISOString().split('T')[0];
    }
    
    updateEnvio(envio.id, updates);
    toast.success(`Estado actualizado a: ${estadosEnvio.find(e => e.value === nuevoEstado)?.label}`);
  };

  const getEstadoBadge = (estado: string) => {
    const estilo = estadosEnvio.find(e => e.value === estado);
    return (
      <Badge variant="outline" className={estilo?.color || 'bg-slate-100'}>
        {estilo?.label || estado}
      </Badge>
    );
  };

  const getMetodoLabel = (metodo: string) => {
    return metodosEnvio.find(m => m.value === metodo)?.label || metodo;
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
          <h1 className="text-2xl font-bold text-slate-800">Envíos y Delivery</h1>
          <p className="text-slate-500">Control de despachos y entregas</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Envío
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{enviosPendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">En Camino</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{enviosEnCamino}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Entregados Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{enviosEntregadosHoy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Costo Total Envíos</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatMonto(totalCostoEnvios)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por factura, cliente o tracking..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {estadosEnvio.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de envíos */}
      <Card>
        <CardHeader>
          <CardTitle>Envíos ({filteredEnvios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEnvios.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Truck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay envíos registrados</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                Registrar primer envío
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Factura</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Dirección</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Método</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Estado</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Costo</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnvios.map(envio => (
                    <tr key={envio.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-mono">{envio.numeroFactura}</td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <p className="font-medium">{envio.cliente.nombre}</p>
                          {envio.cliente.telefono && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {envio.cliente.telefono}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="line-clamp-2">{envio.direccionEntrega}</p>
                            {envio.zona && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {envio.zona}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        {getMetodoLabel(envio.metodo)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="space-y-2">
                          {getEstadoBadge(envio.estado)}
                          {/* Botones rápidos de cambio de estado */}
                          <div className="flex justify-center gap-1">
                            {envio.estado === 'pendiente' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 px-2 text-xs"
                                onClick={() => handleCambiarEstado(envio, 'preparando')}
                              >
                                Preparar
                              </Button>
                            )}
                            {envio.estado === 'preparando' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 px-2 text-xs"
                                onClick={() => handleCambiarEstado(envio, 'en-camino')}
                              >
                                Enviar
                              </Button>
                            )}
                            {envio.estado === 'en-camino' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 px-2 text-xs text-green-600"
                                onClick={() => handleCambiarEstado(envio, 'entregado')}
                              >
                                Entregar
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono">
                        {formatMonto(envio.costoEnvio)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(envio)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(envio)} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar envío */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEnvio ? 'Editar Envío' : 'Nuevo Envío'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Factura */}
              {!editingEnvio && (
                <div className="space-y-2">
                  <Label>Factura *</Label>
                  <Select 
                    value={formData.facturaId} 
                    onValueChange={(v) => {
                      const factura = facturas.find(f => f.id === v);
                      setFormData(prev => ({
                        ...prev,
                        facturaId: v,
                        direccionEntrega: factura?.cliente.direccion || '',
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar factura..." />
                    </SelectTrigger>
                    <SelectContent>
                      {facturasSinEnvio.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.numero} - {f.cliente.razonSocial} ({formatMonto(f.total)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {facturasSinEnvio.length === 0 && (
                    <p className="text-sm text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      No hay facturas pendientes de envío
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Envío *</Label>
                  <Input
                    type="date"
                    value={formData.fechaEnvio}
                    onChange={e => setFormData(prev => ({ ...prev, fechaEnvio: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Estimada de Entrega</Label>
                  <Input
                    type="date"
                    value={formData.fechaEntregaEstimada}
                    onChange={e => setFormData(prev => ({ ...prev, fechaEntregaEstimada: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Método de Envío *</Label>
                  <Select 
                    value={formData.metodo} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, metodo: v as Envio['metodo'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metodosEnvio.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado *</Label>
                  <Select 
                    value={formData.estado} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, estado: v as Envio['estado'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosEnvio.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.metodo !== 'retiro-tienda' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transportista / Mensajero</Label>
                      <Input
                        value={formData.transportista}
                        onChange={e => setFormData(prev => ({ ...prev, transportista: e.target.value }))}
                        placeholder="Nombre del transportista"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono del Transportista</Label>
                      <Input
                        value={formData.telefonoTransportista}
                        onChange={e => setFormData(prev => ({ ...prev, telefonoTransportista: e.target.value }))}
                        placeholder="0414-1234567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Código de Tracking</Label>
                    <Input
                      value={formData.trackingCode}
                      onChange={e => setFormData(prev => ({ ...prev, trackingCode: e.target.value }))}
                      placeholder="TRK-2024-001"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Dirección de Entrega *</Label>
                <textarea
                  value={formData.direccionEntrega}
                  onChange={e => setFormData(prev => ({ ...prev, direccionEntrega: e.target.value }))}
                  placeholder="Dirección completa de entrega"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zona</Label>
                  <Select 
                    value={formData.zona} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, zona: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin zona</SelectItem>
                      {zonasDelivery.map(z => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Costo de Envío (VES)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costoEnvio}
                    onChange={e => setFormData(prev => ({ ...prev, costoEnvio: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Punto de Referencia</Label>
                <Input
                  value={formData.referencia}
                  onChange={e => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                  placeholder="Ej: Frente al supermercado, casa azul con portón blanco"
                />
              </div>

              <div className="space-y-2">
                <Label>Notas Adicionales</Label>
                <textarea
                  value={formData.notas}
                  onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Instrucciones especiales, horario de entrega preferido, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit">
                {editingEnvio ? 'Guardar Cambios' : 'Registrar Envío'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
