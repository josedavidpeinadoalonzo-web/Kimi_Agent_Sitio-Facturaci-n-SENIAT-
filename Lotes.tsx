import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
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
import type { LoteProduccion } from '@/types';

export function Lotes() {
  const { lotes, productos, formulas, addLote, updateLote, deleteLote } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<LoteProduccion | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    productoId: '',
    formulaId: '',
    cantidadProducida: 0,
    unidad: 'ml',
    fechaProduccion: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    responsable: '',
    observaciones: '',
    estado: 'en-proceso' as LoteProduccion['estado'],
  });

  const filteredLotes = lotes.filter(lote => {
    const producto = productos.find(p => p.id === lote.productoId);
    const matchesSearch = 
      lote.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto?.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filtroEstado === 'todos' || lote.estado === filtroEstado;
    return matchesSearch && matchesEstado;
  });

  // Lotes próximos a vencer
  const hoy = new Date();
  const lotesProximosVencer = lotes.filter(lote => {
    if (!lote.fechaVencimiento || lote.estado === 'dispersado') return false;
    const venc = new Date(lote.fechaVencimiento);
    const diasDiff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasDiff <= 30 && diasDiff >= 0;
  });

  const handleOpenDialog = (lote?: LoteProduccion) => {
    if (lote) {
      setEditingLote(lote);
      setFormData({
        codigo: lote.codigo,
        productoId: lote.productoId,
        formulaId: lote.formulaId || '',
        cantidadProducida: lote.cantidadProducida,
        unidad: lote.unidad,
        fechaProduccion: lote.fechaProduccion,
        fechaVencimiento: lote.fechaVencimiento,
        responsable: lote.responsable || '',
        observaciones: lote.observaciones || '',
        estado: lote.estado,
      });
    } else {
      setEditingLote(null);
      setFormData({
        codigo: '',
        productoId: '',
        formulaId: '',
        cantidadProducida: 0,
        unidad: 'ml',
        fechaProduccion: new Date().toISOString().split('T')[0],
        fechaVencimiento: '',
        responsable: '',
        observaciones: '',
        estado: 'en-proceso',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const producto = productos.find(p => p.id === formData.productoId);
    
    if (editingLote) {
      updateLote(editingLote.id, { 
        ...formData, 
        nombreProducto: producto?.descripcion || '' 
      });
      toast.success('Lote actualizado');
    } else {
      addLote({ 
        ...formData, 
        nombreProducto: producto?.descripcion || '' 
      });
      toast.success('Lote registrado');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (lote: LoteProduccion) => {
    if (confirm(`¿Eliminar el lote ${lote.codigo}?`)) {
      deleteLote(lote.id);
      toast.success('Lote eliminado');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      'en-proceso': 'bg-amber-100 text-amber-700',
      'terminado': 'bg-green-100 text-green-700',
      'dispersado': 'bg-slate-100 text-slate-600',
    };
    const labels = {
      'en-proceso': 'En Proceso',
      'terminado': 'Terminado',
      'dispersado': 'Dispersado',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${styles[estado as keyof typeof styles]}`}>
        {labels[estado as keyof typeof labels]}
      </span>
    );
  };

  const getDiasVencimiento = (fechaVenc: string) => {
    const venc = new Date(fechaVenc);
    const dias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return dias;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lotes de Producción</h1>
          <p className="text-slate-500">Control y trazabilidad de lotes</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Lote
        </Button>
      </div>

      {/* Alertas */}
      {lotesProximosVencer.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Lotes Próximos a Vencer</h4>
              <p className="text-sm text-red-700">
                {lotesProximosVencer.length} lote(s) vencen en los próximos 30 días
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar lote..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="en-proceso">En Proceso</SelectItem>
                  <SelectItem value="terminado">Terminado</SelectItem>
                  <SelectItem value="dispersado">Dispersado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes ({filteredLotes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLotes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay lotes registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Producto</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Cantidad</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Producción</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Vencimiento</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLotes.map(lote => {
                    const diasVenc = getDiasVencimiento(lote.fechaVencimiento);
                    const estaProximo = diasVenc <= 30 && diasVenc >= 0 && lote.estado !== 'dispersado';
                    
                    return (
                      <tr key={lote.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-mono">{lote.codigo}</td>
                        <td className="py-3 px-4 text-sm font-medium">{lote.nombreProducto}</td>
                        <td className="py-3 px-4 text-sm text-right">
                          {lote.cantidadProducida} {lote.unidad}
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          {new Date(lote.fechaProduccion).toLocaleDateString('es-VE')}
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span className={estaProximo ? 'text-red-600 font-medium' : ''}>
                            {new Date(lote.fechaVencimiento).toLocaleDateString('es-VE')}
                            {estaProximo && ` (${diasVenc} días)`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getEstadoBadge(lote.estado)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(lote)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(lote)} className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLote ? 'Editar' : 'Nuevo'} Lote</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código del Lote *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="LOT-2024-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(v) => setFormData({ ...formData, estado: v as LoteProduccion['estado'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-proceso">En Proceso</SelectItem>
                      <SelectItem value="terminado">Terminado</SelectItem>
                      <SelectItem value="dispersado">Dispersado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Producto *</Label>
                <Select
                  value={formData.productoId}
                  onValueChange={(v) => {
                    const prod = productos.find(p => p.id === v);
                    setFormData({ 
                      ...formData, 
                      productoId: v,
                      unidad: prod?.unidad || 'ml'
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.filter(p => p.tipo === 'producto-terminado').map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fórmula Utilizada</Label>
                <Select
                  value={formData.formulaId}
                  onValueChange={(v) => setFormData({ ...formData, formulaId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar fórmula..." />
                  </SelectTrigger>
                  <SelectContent>
                    {formulas.filter(f => f.activa).map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nombre} ({f.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad Producida *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cantidadProducida}
                    onChange={e => setFormData({ ...formData, cantidadProducida: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad *</Label>
                  <Select
                    value={formData.unidad}
                    onValueChange={(v) => setFormData({ ...formData, unidad: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="unidades">unidades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Producción *</Label>
                  <Input
                    type="date"
                    value={formData.fechaProduccion}
                    onChange={e => setFormData({ ...formData, fechaProduccion: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Vencimiento *</Label>
                  <Input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={e => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Responsable</Label>
                <Input
                  value={formData.responsable}
                  onChange={e => setFormData({ ...formData, responsable: e.target.value })}
                  placeholder="Nombre del responsable de producción"
                />
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <textarea
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas sobre el lote..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingLote ? 'Guardar Cambios' : 'Registrar Lote'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
