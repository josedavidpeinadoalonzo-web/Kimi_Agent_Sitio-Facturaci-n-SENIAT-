import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Beaker, AlertTriangle } from 'lucide-react';
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
import type { MateriaPrima } from '@/types';

const categorias = [
  { value: 'aceite-vegetal', label: 'Aceite Vegetal' },
  { value: 'aceite-esencial', label: 'Aceite Esencial' },
  { value: 'extracto', label: 'Extracto' },
  { value: 'activo', label: 'Activo Cosmético' },
  { value: 'emulsionante', label: 'Emulsionante' },
  { value: 'conservante', label: 'Conservante' },
  { value: 'otro', label: 'Otro' },
];

const unidades = ['ml', 'L', 'g', 'kg', 'gotas'];

export function MateriasPrimas() {
  const { materiasPrimas, addMateriaPrima, updateMateriaPrima, deleteMateriaPrima } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMP, setEditingMP] = useState<MateriaPrima | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'otro' as MateriaPrima['categoria'],
    proveedor: '',
    stock: 0,
    unidad: 'ml',
    costoUnitario: 0,
    lote: '',
    fechaVencimiento: '',
    observaciones: '',
  });

  const filteredMP = materiasPrimas.filter(mp => {
    const matchesSearch = 
      mp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mp.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filtroCategoria === 'todas' || mp.categoria === filtroCategoria;
    return matchesSearch && matchesCategoria;
  });

  // Verificar materias primas con stock bajo
  const stockBajo = materiasPrimas.filter(mp => mp.stock <= 100);
  
  // Verificar materias primas próximas a vencer
  const hoy = new Date();
  const proximasVencer = materiasPrimas.filter(mp => {
    if (!mp.fechaVencimiento) return false;
    const venc = new Date(mp.fechaVencimiento);
    const diasDiff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasDiff <= 30 && diasDiff >= 0;
  });

  const handleOpenDialog = (mp?: MateriaPrima) => {
    if (mp) {
      setEditingMP(mp);
      setFormData({
        codigo: mp.codigo,
        nombre: mp.nombre,
        categoria: mp.categoria,
        proveedor: mp.proveedor || '',
        stock: mp.stock,
        unidad: mp.unidad,
        costoUnitario: mp.costoUnitario,
        lote: mp.lote || '',
        fechaVencimiento: mp.fechaVencimiento || '',
        observaciones: mp.observaciones || '',
      });
    } else {
      setEditingMP(null);
      setFormData({
        codigo: '',
        nombre: '',
        categoria: 'otro',
        proveedor: '',
        stock: 0,
        unidad: 'ml',
        costoUnitario: 0,
        lote: '',
        fechaVencimiento: '',
        observaciones: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMP) {
      updateMateriaPrima(editingMP.id, formData);
      toast.success('Materia prima actualizada');
    } else {
      addMateriaPrima({
        ...formData,
        fechaIngreso: new Date().toISOString().split('T')[0],
      });
      toast.success('Materia prima registrada');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (mp: MateriaPrima) => {
    if (confirm(`¿Eliminar ${mp.nombre}?`)) {
      deleteMateriaPrima(mp.id);
      toast.success('Materia prima eliminada');
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  const getCategoriaLabel = (cat: string) => {
    return categorias.find(c => c.value === cat)?.label || cat;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Materias Primas</h1>
          <p className="text-slate-500">Control de insumos para producción</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Materia Prima
        </Button>
      </div>

      {/* Alertas */}
      {(stockBajo.length > 0 || proximasVencer.length > 0) && (
        <div className="space-y-3">
          {stockBajo.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Stock Bajo</h4>
                  <p className="text-sm text-red-700">
                    {stockBajo.length} materia(s) prima(s) con stock menor a 100 {stockBajo[0]?.unidad}
                  </p>
                </div>
              </div>
            </div>
          )}
          {proximasVencer.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Próximas a Vencer</h4>
                  <p className="text-sm text-amber-700">
                    {proximasVencer.length} materia(s) prima(s) vencen en los próximos 30 días
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar materia prima..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
          <CardTitle>Inventario ({filteredMP.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMP.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Beaker className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay materias primas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Categoría</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Stock</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Costo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Vencimiento</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMP.map(mp => (
                    <tr key={mp.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-mono">{mp.codigo}</td>
                      <td className="py-3 px-4 text-sm font-medium">{mp.nombre}</td>
                      <td className="py-3 px-4 text-sm">{getCategoriaLabel(mp.categoria)}</td>
                      <td className={`py-3 px-4 text-sm text-right font-mono ${mp.stock <= 100 ? 'text-red-600 font-bold' : ''}`}>
                        {mp.stock} {mp.unidad}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono">{formatMonto(mp.costoUnitario)}</td>
                      <td className="py-3 px-4 text-sm">
                        {mp.fechaVencimiento ? (
                          <span className={proximasVencer.some(p => p.id === mp.id) ? 'text-amber-600 font-medium' : ''}>
                            {new Date(mp.fechaVencimiento).toLocaleDateString('es-VE')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(mp)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(mp)} className="text-red-600">
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMP ? 'Editar' : 'Nueva'} Materia Prima</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="MP-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(v) => setFormData({ ...formData, categoria: v as MateriaPrima['categoria'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Aceite de Coco Virgen"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Input
                  value={formData.proveedor}
                  onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Stock *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
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
                      {unidades.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Costo Unit. *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costoUnitario}
                    onChange={e => setFormData({ ...formData, costoUnitario: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lote</Label>
                  <Input
                    value={formData.lote}
                    onChange={e => setFormData({ ...formData, lote: e.target.value })}
                    placeholder="Lote-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Vencimiento</Label>
                  <Input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={e => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <textarea
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas adicionales..."
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
                {editingMP ? 'Guardar Cambios' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
