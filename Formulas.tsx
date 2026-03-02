import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FlaskConical, Calculator, Save, X } from 'lucide-react';
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
import type { Formula, IngredienteFormula } from '@/types';

const categorias = [
  { value: 'crema', label: 'Crema' },
  { value: 'gel', label: 'Gel' },
  { value: 'shampoo', label: 'Shampoo' },
  { value: 'acondicionador', label: 'Acondicionador' },
  { value: 'aceite', label: 'Aceite' },
  { value: 'jabon', label: 'Jabón' },
  { value: 'otro', label: 'Otro' },
];

export function Formulas() {
  const { formulas, materiasPrimas, addFormula, updateFormula, deleteFormula, calcularCostoFormula } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [ingredientes, setIngredientes] = useState<IngredienteFormula[]>([]);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'crema' as Formula['categoria'],
    descripcion: '',
    procedimiento: '',
    rendimiento: 1000,
    unidadRendimiento: 'ml',
    tiempoPreparacion: '',
    precauciones: '',
    activa: true,
  });

  const filteredFormulas = formulas.filter(f => {
    const matchesSearch = 
      f.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filtroCategoria === 'todas' || f.categoria === filtroCategoria;
    return matchesSearch && matchesCategoria;
  });

  const handleOpenDialog = (formula?: Formula) => {
    if (formula) {
      setEditingFormula(formula);
      setFormData({
        codigo: formula.codigo,
        nombre: formula.nombre,
        categoria: formula.categoria,
        descripcion: formula.descripcion,
        procedimiento: formula.procedimiento,
        rendimiento: formula.rendimiento,
        unidadRendimiento: formula.unidadRendimiento,
        tiempoPreparacion: formula.tiempoPreparacion || '',
        precauciones: formula.precauciones || '',
        activa: formula.activa,
      });
      setIngredientes(formula.ingredientes);
    } else {
      setEditingFormula(null);
      setFormData({
        codigo: '',
        nombre: '',
        categoria: 'crema',
        descripcion: '',
        procedimiento: '',
        rendimiento: 1000,
        unidadRendimiento: 'ml',
        tiempoPreparacion: '',
        precauciones: '',
        activa: true,
      });
      setIngredientes([]);
    }
    setIsDialogOpen(true);
  };

  const handleAddIngrediente = () => {
    setIngredientes([...ingredientes, {
      materiaPrimaId: '',
      nombre: '',
      cantidad: 0,
      unidad: 'ml',
      porcentaje: 0,
      costo: 0,
    }]);
  };

  const handleUpdateIngrediente = (index: number, field: keyof IngredienteFormula, value: any) => {
    const newIngredientes = [...ingredientes];
    
    if (field === 'materiaPrimaId') {
      const mp = materiasPrimas.find(m => m.id === value);
      if (mp) {
        newIngredientes[index] = {
          ...newIngredientes[index],
          materiaPrimaId: value,
          nombre: mp.nombre,
          unidad: mp.unidad,
          costo: mp.costoUnitario * newIngredientes[index].cantidad,
        };
      }
    } else if (field === 'cantidad') {
      const mp = materiasPrimas.find(m => m.id === newIngredientes[index].materiaPrimaId);
      newIngredientes[index] = {
        ...newIngredientes[index],
        cantidad: value,
        costo: mp ? mp.costoUnitario * value : 0,
      };
    } else {
      newIngredientes[index] = { ...newIngredientes[index], [field]: value };
    }
    
    // Recalcular porcentajes
    const totalCantidad = newIngredientes.reduce((sum, ing) => sum + (ing.unidad === 'g' || ing.unidad === 'ml' ? ing.cantidad : ing.cantidad * 1000), 0);
    newIngredientes.forEach((ing, i) => {
      const cantidadNormalizada = ing.unidad === 'g' || ing.unidad === 'ml' ? ing.cantidad : ing.cantidad * 1000;
      newIngredientes[i].porcentaje = totalCantidad > 0 ? (cantidadNormalizada / totalCantidad) * 100 : 0;
    });
    
    setIngredientes(newIngredientes);
  };

  const handleRemoveIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ingredientes.length === 0) {
      toast.error('Debe agregar al menos un ingrediente');
      return;
    }

    const costoTotal = calcularCostoFormula(ingredientes);
    
    if (editingFormula) {
      updateFormula(editingFormula.id, { ...formData, ingredientes, costoTotal });
      toast.success('Fórmula actualizada');
    } else {
      addFormula({ ...formData, ingredientes, costoTotal });
      toast.success('Fórmula registrada');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (formula: Formula) => {
    if (confirm(`¿Eliminar la fórmula ${formula.nombre}?`)) {
      deleteFormula(formula.id);
      toast.success('Fórmula eliminada');
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

  const costoTotal = calcularCostoFormula(ingredientes);
  const costoPorUnidad = formData.rendimiento > 0 ? costoTotal / formData.rendimiento : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fórmulas</h1>
          <p className="text-slate-500">Recetas y procedimientos de producción</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Fórmula
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar fórmula..."
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
          <CardTitle>Fórmulas ({filteredFormulas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFormulas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FlaskConical className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay fórmulas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Categoría</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Ingredientes</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Costo</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Rendimiento</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFormulas.map(formula => (
                    <tr key={formula.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-mono">{formula.codigo}</td>
                      <td className="py-3 px-4 text-sm font-medium">{formula.nombre}</td>
                      <td className="py-3 px-4 text-sm">{getCategoriaLabel(formula.categoria)}</td>
                      <td className="py-3 px-4 text-sm text-right">{formula.ingredientes.length}</td>
                      <td className="py-3 px-4 text-sm text-right font-mono">{formatMonto(formula.costoTotal)}</td>
                      <td className="py-3 px-4 text-sm text-center">{formula.rendimiento} {formula.unidadRendimiento}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(formula)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(formula)} className="text-red-600">
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
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFormula ? 'Editar' : 'Nueva'} Fórmula</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Datos básicos */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="FORM-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(v) => setFormData({ ...formData, categoria: v as Formula['categoria'] })}
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
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Crema Mentolada"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del producto..."
                />
              </div>

              {/* Rendimiento */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rendimiento *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.rendimiento}
                    onChange={e => setFormData({ ...formData, rendimiento: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad *</Label>
                  <Select
                    value={formData.unidadRendimiento}
                    onValueChange={(v) => setFormData({ ...formData, unidadRendimiento: v })}
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
                <div className="space-y-2">
                  <Label>Tiempo de Preparación</Label>
                  <Input
                    value={formData.tiempoPreparacion}
                    onChange={e => setFormData({ ...formData, tiempoPreparacion: e.target.value })}
                    placeholder="2 horas"
                  />
                </div>
              </div>

              {/* Ingredientes */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Ingredientes
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddIngrediente}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Ingrediente
                  </Button>
                </div>

                {ingredientes.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No hay ingredientes. Agrega materias primas a la fórmula.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ingredientes.map((ing, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-2 rounded">
                        <div className="col-span-4">
                          <Label className="text-xs">Materia Prima</Label>
                          <Select
                            value={ing.materiaPrimaId}
                            onValueChange={(v) => handleUpdateIngrediente(index, 'materiaPrimaId', v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {materiasPrimas.map(mp => (
                                <SelectItem key={mp.id} value={mp.id}>
                                  {mp.nombre} ({mp.stock} {mp.unidad})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ing.cantidad}
                            onChange={e => handleUpdateIngrediente(index, 'cantidad', parseFloat(e.target.value))}
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Unidad</Label>
                          <Input value={ing.unidad} disabled className="h-8 bg-slate-100" />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">%</Label>
                          <Input value={ing.porcentaje.toFixed(2)} disabled className="h-8 bg-slate-100" />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs">Costo</Label>
                          <p className="text-sm font-mono">{formatMonto(ing.costo)}</p>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveIngrediente(index)}
                            className="h-8 w-8 text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Totales */}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Costo Total de Producción:</span>
                        <span className="text-lg font-bold font-mono text-blue-600">
                          {formatMonto(costoTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>Costo por {formData.unidadRendimiento}:</span>
                        <span className="font-mono">{formatMonto(costoPorUnidad)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Procedimiento */}
              <div className="space-y-2">
                <Label>Procedimiento de Elaboración</Label>
                <textarea
                  value={formData.procedimiento}
                  onChange={e => setFormData({ ...formData, procedimiento: e.target.value })}
                  placeholder="Describa paso a paso el procedimiento de elaboración..."
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              {/* Precauciones */}
              <div className="space-y-2">
                <Label>Precauciones y Observaciones</Label>
                <textarea
                  value={formData.precauciones}
                  onChange={e => setFormData({ ...formData, precauciones: e.target.value })}
                  placeholder="Precauciones de seguridad, almacenamiento, etc."
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
                <Save className="mr-2 h-4 w-4" />
                {editingFormula ? 'Guardar Cambios' : 'Guardar Fórmula'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
