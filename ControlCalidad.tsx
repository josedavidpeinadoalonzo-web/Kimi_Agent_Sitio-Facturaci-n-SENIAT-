import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ClipboardCheck, Beaker, AlertCircle, CheckCircle, FileText, Calendar } from 'lucide-react';
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

// Tipos de pruebas para productos cosméticos
const tiposPrueba = [
  { value: 'estabilidad', label: 'Prueba de Estabilidad', icon: Calendar },
  { value: 'microbiologico', label: 'Análisis Microbiológico', icon: Beaker },
  { value: 'ph', label: 'Medición de pH', icon: Beaker },
  { value: 'viscosidad', label: 'Prueba de Viscosidad', icon: Beaker },
  { value: 'sensorial', label: 'Evaluación Sensorial', icon: CheckCircle },
  { value: 'compatibilidad', label: 'Prueba de Compatibilidad', icon: AlertCircle },
  { value: 'eficacia', label: 'Prueba de Eficacia', icon: CheckCircle },
  { value: 'irritacion', label: 'Prueba de Irritación', icon: AlertCircle },
  { value: 'otro', label: 'Otra Prueba', icon: FileText },
];

const estadosPrueba = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  { value: 'en-proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-700' },
  { value: 'aprobado', label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  { value: 'rechazado', label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  { value: 'repetir', label: 'Repetir Prueba', color: 'bg-purple-100 text-purple-700' },
];

interface PruebaCalidad {
  id: string;
  codigo: string;
  loteId: string;
  nombreProducto: string;
  tipoPrueba: string;
  fechaPrueba: string;
  fechaResultado?: string;
  responsable: string;
  parametros: string;
  resultado: string;
  observaciones: string;
  estado: 'pendiente' | 'en-proceso' | 'aprobado' | 'rechazado' | 'repetir';
  documento?: string;
}

export function ControlCalidad() {
  const { lotes } = useApp();
  const [pruebas, setPruebas] = useState<PruebaCalidad[]>(() => {
    const stored = localStorage.getItem('seniat_pruebas_calidad');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrueba, setEditingPrueba] = useState<PruebaCalidad | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    loteId: '',
    tipoPrueba: 'estabilidad',
    fechaPrueba: new Date().toISOString().split('T')[0],
    fechaResultado: '',
    responsable: '',
    parametros: '',
    resultado: '',
    observaciones: '',
    estado: 'pendiente' as PruebaCalidad['estado'],
  });

  // Guardar en localStorage cuando cambien
  const savePruebas = (newPruebas: PruebaCalidad[]) => {
    setPruebas(newPruebas);
    localStorage.setItem('seniat_pruebas_calidad', JSON.stringify(newPruebas));
  };

  const filteredPruebas = pruebas.filter(p => {
    const matchesSearch = 
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filtroTipo === 'todos' || p.tipoPrueba === filtroTipo;
    const matchesEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Estadísticas
  const pruebasPendientes = pruebas.filter(p => p.estado === 'pendiente').length;
  const pruebasAprobadas = pruebas.filter(p => p.estado === 'aprobado').length;
  const pruebasRechazadas = pruebas.filter(p => p.estado === 'rechazado').length;

  const handleOpenDialog = (prueba?: PruebaCalidad) => {
    if (prueba) {
      setEditingPrueba(prueba);
      setFormData({
        codigo: prueba.codigo,
        loteId: prueba.loteId,
        tipoPrueba: prueba.tipoPrueba,
        fechaPrueba: prueba.fechaPrueba,
        fechaResultado: prueba.fechaResultado || '',
        responsable: prueba.responsable,
        parametros: prueba.parametros,
        resultado: prueba.resultado,
        observaciones: prueba.observaciones,
        estado: prueba.estado,
      });
    } else {
      setEditingPrueba(null);
      setFormData({
        codigo: '',
        loteId: '',
        tipoPrueba: 'estabilidad',
        fechaPrueba: new Date().toISOString().split('T')[0],
        fechaResultado: '',
        responsable: '',
        parametros: '',
        resultado: '',
        observaciones: '',
        estado: 'pendiente',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lote = lotes.find(l => l.id === formData.loteId);
    
    if (editingPrueba) {
      const updated = pruebas.map(p => 
        p.id === editingPrueba.id 
          ? { ...p, ...formData, nombreProducto: lote?.nombreProducto || '' }
          : p
      );
      savePruebas(updated);
      toast.success('Prueba actualizada');
    } else {
      const nuevaPrueba: PruebaCalidad = {
        id: crypto.randomUUID(),
        ...formData,
        nombreProducto: lote?.nombreProducto || '',
      };
      savePruebas([...pruebas, nuevaPrueba]);
      toast.success('Prueba registrada');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (prueba: PruebaCalidad) => {
    if (confirm(`¿Eliminar la prueba ${prueba.codigo}?`)) {
      savePruebas(pruebas.filter(p => p.id !== prueba.id));
      toast.success('Prueba eliminada');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilo = estadosPrueba.find(e => e.value === estado);
    return (
      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${estilo?.color || 'bg-slate-100'}`}>
        {estilo?.label || estado}
      </span>
    );
  };

  const getTipoLabel = (tipo: string) => {
    return tiposPrueba.find(t => t.value === tipo)?.label || tipo;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Calidad</h1>
          <p className="text-slate-500">Pruebas y análisis de productos</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Prueba
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pruebas</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pruebas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pruebasPendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pruebasAprobadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Rechazadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pruebasRechazadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar prueba..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de prueba" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {tiposPrueba.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {estadosPrueba.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
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
          <CardTitle>Registro de Pruebas ({filteredPruebas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPruebas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Beaker className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay pruebas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Producto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Tipo de Prueba</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Responsable</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPruebas.map(prueba => (
                    <tr key={prueba.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-mono">{prueba.codigo}</td>
                      <td className="py-3 px-4 text-sm font-medium">{prueba.nombreProducto}</td>
                      <td className="py-3 px-4 text-sm">{getTipoLabel(prueba.tipoPrueba)}</td>
                      <td className="py-3 px-4 text-sm text-center">
                        {new Date(prueba.fechaPrueba).toLocaleDateString('es-VE')}
                      </td>
                      <td className="py-3 px-4 text-sm">{prueba.responsable}</td>
                      <td className="py-3 px-4 text-center">
                        {getEstadoBadge(prueba.estado)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(prueba)} title="Ver/Editar">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(prueba)} className="text-red-600" title="Eliminar">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPrueba ? 'Editar' : 'Nueva'} Prueba de Calidad</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código de Prueba *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="PC-2024-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Prueba *</Label>
                  <Select
                    value={formData.tipoPrueba}
                    onValueChange={(v) => setFormData({ ...formData, tipoPrueba: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposPrueba.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lote/Producto *</Label>
                <Select
                  value={formData.loteId}
                  onValueChange={(v) => setFormData({ ...formData, loteId: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map(lote => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.codigo} - {lote.nombreProducto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Prueba *</Label>
                  <Input
                    type="date"
                    value={formData.fechaPrueba}
                    onChange={e => setFormData({ ...formData, fechaPrueba: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Resultado</Label>
                  <Input
                    type="date"
                    value={formData.fechaResultado}
                    onChange={e => setFormData({ ...formData, fechaResultado: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Responsable *</Label>
                <Input
                  value={formData.responsable}
                  onChange={e => setFormData({ ...formData, responsable: e.target.value })}
                  placeholder="Nombre del analista"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Parámetros Evaluados</Label>
                <textarea
                  value={formData.parametros}
                  onChange={e => setFormData({ ...formData, parametros: e.target.value })}
                  placeholder="Ej: pH: 5.5-6.5, Viscosidad: 5000-8000 cps, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Resultado de la Prueba</Label>
                <textarea
                  value={formData.resultado}
                  onChange={e => setFormData({ ...formData, resultado: e.target.value })}
                  placeholder="Describa los resultados obtenidos..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(v) => setFormData({ ...formData, estado: v as PruebaCalidad['estado'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosPrueba.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <textarea
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas adicionales, recomendaciones, etc."
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
                {editingPrueba ? 'Guardar Cambios' : 'Registrar Prueba'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
