import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import type { Cliente } from '@/types';

export function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente, getClienteByRif } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    razonSocial: '',
    rif: '',
    direccion: '',
    telefono: '',
    email: '',
    tipo: 'minorista' as Cliente['tipo'],
  });

  const filteredClientes = clientes.filter(
    c =>
      c.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.rif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        razonSocial: cliente.razonSocial,
        rif: cliente.rif,
        direccion: cliente.direccion,
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        tipo: cliente.tipo,
      });
    } else {
      setEditingCliente(null);
      setFormData({
        razonSocial: '',
        rif: '',
        direccion: '',
        telefono: '',
        email: '',
        tipo: 'minorista',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCliente(null);
    setFormData({
      razonSocial: '',
      rif: '',
      direccion: '',
      telefono: '',
      email: '',
      tipo: 'minorista',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar RIF
    const rifRegex = /^[VJEGP]-\d{8}-\d$/;
    if (!rifRegex.test(formData.rif)) {
      toast.error('El RIF debe tener el formato J-12345678-9');
      return;
    }

    // Verificar si el RIF ya existe
    const existing = getClienteByRif(formData.rif);
    if (existing && (!editingCliente || existing.id !== editingCliente.id)) {
      toast.error('Ya existe un cliente con este RIF');
      return;
    }

    if (editingCliente) {
      updateCliente(editingCliente.id, formData);
      toast.success('Cliente actualizado correctamente');
    } else {
      addCliente(formData);
      toast.success('Cliente registrado correctamente');
    }
    handleCloseDialog();
  };

  const handleDelete = (cliente: Cliente) => {
    if (confirm(`¿Está seguro de eliminar al cliente ${cliente.razonSocial}?`)) {
      deleteCliente(cliente.id);
      toast.success('Cliente eliminado correctamente');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Clientes</h1>
          <p className="text-slate-500">Administre los clientes de su empresa</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o RIF..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredClientes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClientes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay clientes registrados</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                Registrar primer cliente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Razón Social</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">RIF</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Dirección</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Contacto</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map(cliente => (
                    <tr key={cliente.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium">{cliente.razonSocial}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{cliente.rif}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                        {cliente.direccion}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {cliente.telefono && <div>{cliente.telefono}</div>}
                        {cliente.email && <div className="text-xs">{cliente.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(cliente)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cliente)}
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

      {/* Dialog para crear/editar cliente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="razonSocial">
                  Razón Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="razonSocial"
                  value={formData.razonSocial}
                  onChange={e => setFormData(prev => ({ ...prev, razonSocial: e.target.value }))}
                  placeholder="Nombre completo del cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rif">
                  RIF <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rif"
                  value={formData.rif}
                  onChange={e => setFormData(prev => ({ ...prev, rif: e.target.value }))}
                  placeholder="J-12345678-9"
                  required
                />
                <p className="text-xs text-slate-500">Formato: J-12345678-9, V-12345678-9</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">
                  Dirección <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={e => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección fiscal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={e => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="(0212) 555-1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Cliente</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value as Cliente['tipo'] }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="minorista">Minorista</option>
                  <option value="mayorista">Mayorista</option>
                  <option value="distribuidor">Distribuidor</option>
                  <option value="laboratorio">Laboratorio</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit">
                {editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
