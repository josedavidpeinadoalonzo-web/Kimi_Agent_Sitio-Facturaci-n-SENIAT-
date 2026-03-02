import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, User, Shield, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { db, type UserData, type UserRole, PERMISOS } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

const ROLES: { value: UserRole; label: string; description: string; color: string }[] = [
  { 
    value: 'admin', 
    label: 'Administrador', 
    description: 'Acceso total al sistema',
    color: 'bg-purple-100 text-purple-700'
  },
  { 
    value: 'vendedor', 
    label: 'Vendedor', 
    description: 'Ventas, clientes y catálogo',
    color: 'bg-blue-100 text-blue-700'
  },
  { 
    value: 'produccion', 
    label: 'Producción', 
    description: 'Fórmulas, lotes e inventario',
    color: 'bg-green-100 text-green-700'
  },
  { 
    value: 'contador', 
    label: 'Contador', 
    description: 'Facturas, pagos y reportes',
    color: 'bg-amber-100 text-amber-700'
  },
];

export function Usuarios() {
  const { userData: currentUser, isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [nuevoRol, setNuevoRol] = useState<UserRole>('vendedor');

  // Cargar usuarios de la empresa
  useEffect(() => {
    if (!currentUser?.empresaId) return;

    const q = query(
      collection(db, 'usuarios'),
      where('empresaId', '==', currentUser.empresaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserData);
      setUsuarios(users);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.empresaId]);

  const filteredUsuarios = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditRole = (user: UserData) => {
    setEditingUser(user);
    setNuevoRol(user.rol);
    setShowEditDialog(true);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;

    try {
      await updateDoc(doc(db, 'usuarios', editingUser.uid), {
        rol: nuevoRol
      });
      toast.success('Rol actualizado correctamente');
      setShowEditDialog(false);
    } catch (error) {
      toast.error('Error al actualizar el rol');
    }
  };

  const handleToggleActivo = async (user: UserData) => {
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), {
        activo: !user.activo
      });
      toast.success(user.activo ? 'Usuario desactivado' : 'Usuario activado');
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  const getRoleBadge = (rol: UserRole) => {
    const roleConfig = ROLES.find(r => r.value === rol);
    return (
      <Badge className={roleConfig?.color || 'bg-slate-100'}>
        {roleConfig?.label || rol}
      </Badge>
    );
  };

  const formatFecha = (fecha?: string) => {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Shield className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Acceso Restringido</h2>
        <p className="text-slate-500">Solo los administradores pueden gestionar usuarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500">Administra los usuarios de tu empresa</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{usuarios.length}</div>
            <p className="text-sm text-slate-500">Total Usuarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {usuarios.filter(u => u.activo).length}
            </div>
            <p className="text-sm text-slate-500">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {usuarios.filter(u => u.rol === 'admin').length}
            </div>
            <p className="text-sm text-slate-500">Administradores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {usuarios.filter(u => u.rol === 'vendedor').length}
            </div>
            <p className="text-sm text-slate-500">Vendedores</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar usuario por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsuarios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Rol</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Último Acceso</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.uid} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {usuario.nombre[0]}{usuario.apellido[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{usuario.nombre} {usuario.apellido}</p>
                            <p className="text-sm text-slate-500">{usuario.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getRoleBadge(usuario.rol)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {formatFecha(usuario.ultimoAcceso)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRole(usuario)}
                            title="Cambiar rol"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActivo(usuario)}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                            className={usuario.activo ? 'text-red-600' : 'text-green-600'}
                          >
                            {usuario.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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

      {/* Info de permisos */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Permisos por Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLES.map((rol) => (
              <div key={rol.value} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={rol.color}>{rol.label}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-2">{rol.description}</p>
                <div className="flex flex-wrap gap-1">
                  {PERMISOS[rol.value].slice(0, 6).map((permiso) => (
                    <span key={permiso} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {permiso}
                    </span>
                  ))}
                  {PERMISOS[rol.value].length > 6 && (
                    <span className="text-xs text-slate-500">+{PERMISOS[rol.value].length - 6} más</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              {editingUser && `Modificando rol de ${editingUser.nombre} ${editingUser.apellido}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuevo Rol</Label>
              <Select value={nuevoRol} onValueChange={(v) => setNuevoRol(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((rol) => (
                    <SelectItem key={rol.value} value={rol.value}>
                      <div className="flex flex-col">
                        <span>{rol.label}</span>
                        <span className="text-xs text-slate-500">{rol.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> El usuario deberá cerrar sesión y volver a iniciar 
                para que los cambios surtan efecto completamente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
