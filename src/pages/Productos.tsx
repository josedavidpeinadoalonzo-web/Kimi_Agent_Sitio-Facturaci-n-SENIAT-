import { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Package, X, Image, Wand2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import type { Producto } from '@/types';

export function Productos() {
  const { productos, addProducto, updateProducto, deleteProducto, getProductoByCodigo, generarCodigoProducto } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'producto-terminado' as Producto['tipo'],
    precio: '',
    costo: '',
    stock: '',
    unidad: 'UNIDAD',
    activo: true,
    imagen: '',
  });

  const filteredProductos = productos.filter(
    p =>
      p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (producto?: Producto) => {
    if (producto) {
      setEditingProducto(producto);
      setFormData({
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        tipo: producto.tipo,
        precio: producto.precio.toString(),
        costo: producto.costo?.toString() || '',
        stock: producto.stock?.toString() || '',
        unidad: producto.unidad,
        activo: producto.activo,
        imagen: producto.imagen || '',
      });
      setImagenPreview(producto.imagen || null);
    } else {
      setEditingProducto(null);
      setFormData({
        codigo: '',
        descripcion: '',
        tipo: 'producto-terminado',
        precio: '',
        costo: '',
        stock: '',
        unidad: 'UNIDAD',
        activo: true,
        imagen: '',
      });
      setImagenPreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProducto(null);
    setImagenPreview(null);
    setFormData({
      codigo: '',
      descripcion: '',
      tipo: 'producto-terminado',
      precio: '',
      costo: '',
      stock: '',
      unidad: 'UNIDAD',
      activo: true,
      imagen: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      toast.error('El precio debe ser mayor a cero');
      return;
    }

    // Verificar si el código ya existe
    const existing = getProductoByCodigo(formData.codigo);
    if (existing && (!editingProducto || existing.id !== editingProducto.id)) {
      toast.error('Ya existe un producto con este código');
      return;
    }

    const productoData = {
      codigo: formData.codigo,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      precio,
      costo: formData.costo ? parseFloat(formData.costo) : undefined,
      stock: formData.stock ? parseInt(formData.stock) : undefined,
      unidad: formData.unidad,
      activo: formData.activo,
      imagen: formData.imagen || undefined,
    };

    if (editingProducto) {
      updateProducto(editingProducto.id, productoData);
      toast.success('Producto actualizado correctamente');
    } else {
      addProducto(productoData);
      toast.success('Producto registrado correctamente');
    }
    handleCloseDialog();
  };

  const handleDelete = (producto: Producto) => {
    if (confirm(`¿Está seguro de eliminar el producto ${producto.descripcion}?`)) {
      deleteProducto(producto.id);
      toast.success('Producto eliminado correctamente');
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  // Función para generar código automático
  const handleGenerarCodigo = () => {
    if (!formData.descripcion.trim()) {
      toast.error('Primero ingrese la descripción del producto');
      return;
    }
    const nuevoCodigo = generarCodigoProducto(formData.descripcion);
    setFormData(prev => ({ ...prev, codigo: nuevoCodigo }));
    toast.success(`Código generado: ${nuevoCodigo}`);
  };

  // Función para manejar la carga de imágenes
  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagenPreview(base64);
        setFormData(prev => ({ ...prev, imagen: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEliminarImagen = () => {
    setImagenPreview(null);
    setFormData(prev => ({ ...prev, imagen: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Productos y Servicios</h1>
          <p className="text-slate-500">Administre su catálogo de productos</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por código o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos ({filteredProductos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProductos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay productos registrados</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                Registrar primer producto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Imagen</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Descripción</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Unidad</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Precio</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductos.map(producto => (
                    <tr key={producto.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {producto.imagen ? (
                          <img 
                            src={producto.imagen} 
                            alt={producto.descripcion}
                            className="h-12 w-12 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">{producto.codigo}</td>
                      <td className="py-3 px-4 text-sm">{producto.descripcion}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{producto.unidad}</td>
                      <td className="py-3 px-4 text-sm text-right font-mono">
                        {formatMonto(producto.precio)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            producto.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {producto.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(producto)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(producto)}
                            className="text-red-600 hover:text-red-700"
                          >
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

      {/* Dialog para crear/editar producto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProducto ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Imagen del producto */}
              <div className="space-y-2">
                <Label>Imagen del Producto</Label>
                <div className="flex items-center gap-4">
                  {imagenPreview ? (
                    <div className="relative">
                      <img 
                        src={imagenPreview} 
                        alt="Preview" 
                        className="h-24 w-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleEliminarImagen}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="h-24 w-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image className="h-8 w-8 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Subir imagen</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImagenChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {imagenPreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </Button>
                    <p className="text-xs text-slate-500 mt-2">
                      Máximo 2MB. Formatos: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">
                    Código <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={e => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                      placeholder="PROD-001"
                      required
                      className="flex-1"
                    />
                    {!editingProducto && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerarCodigo}
                        title="Generar código automático"
                      >
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {!editingProducto && (
                    <p className="text-xs text-slate-500">
                      Ingrese manualmente o genere automáticamente desde el nombre
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidad">
                    Unidad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unidad"
                    value={formData.unidad}
                    onChange={e => setFormData(prev => ({ ...prev, unidad: e.target.value }))}
                    placeholder="UNIDAD"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">
                  Descripción <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del producto o servicio"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Producto</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value as Producto['tipo'] }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="producto-terminado">Producto Terminado</option>
                  <option value="materia-prima">Materia Prima</option>
                  <option value="insumo">Insumo</option>
                  <option value="servicio">Servicio</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">
                    Precio (VES) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={e => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costo">Costo (VES)</Label>
                  <Input
                    id="costo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costo}
                    onChange={e => setFormData(prev => ({ ...prev, costo: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 flex items-center justify-between">
                  <Label htmlFor="activo">Activo</Label>
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, activo: checked }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit">
                {editingProducto ? 'Guardar Cambios' : 'Registrar Producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
