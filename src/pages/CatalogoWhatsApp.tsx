import { useState, useRef } from 'react';
import { Share2, MessageCircle, Copy, Check, ShoppingCart, Search, Package, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface ProductoCarrito {
  productoId: string;
  codigo: string;
  descripcion: string;
  precio: number;
  cantidad: number;
}

export function CatalogoWhatsApp() {
  const { productos, empresa, configuracion } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
  const [showCarritoDialog, setShowCarritoDialog] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [copied, setCopied] = useState(false);
  const mensajeRef = useRef<HTMLTextAreaElement>(null);

  // Filtrar solo productos terminados activos
  const productosFiltrados = productos.filter(p => {
    const matchesSearch = 
      p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filtroCategoria === 'todos' || p.tipo === filtroCategoria;
    return p.activo && p.tipo === 'producto-terminado' && matchesSearch && matchesCategoria;
  });

  const categorias = [
    { value: 'todos', label: 'Todos' },
    { value: 'producto-terminado', label: 'Productos Terminados' },
    { value: 'materia-prima', label: 'Materias Primas' },
    { value: 'servicio', label: 'Servicios' },
  ];

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  const agregarAlCarrito = (producto: typeof productos[0]) => {
    const existente = carrito.find(item => item.productoId === producto.id);
    if (existente) {
      setCarrito(carrito.map(item => 
        item.productoId === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        productoId: producto.id,
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        precio: producto.precio,
        cantidad: 1,
      }]);
    }
    toast.success(`${producto.descripcion} agregado al carrito`);
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(carrito.filter(item => item.productoId !== productoId));
  };

  const actualizarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }
    setCarrito(carrito.map(item => 
      item.productoId === productoId 
        ? { ...item, cantidad }
        : item
    ));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const generarMensajeWhatsApp = () => {
    let mensaje = `¡Hola! 👋\n\n`;
    
    if (clienteNombre) {
      mensaje += `Soy *${clienteNombre}*\n\n`;
    }
    
    mensaje += `Me interesa realizar un pedido de los siguientes productos de *${empresa?.razonSocial || 'su tienda'}*:\n\n`;
    
    carrito.forEach((item, index) => {
      mensaje += `${index + 1}. *${item.descripcion}*\n`;
      mensaje += `   Código: ${item.codigo}\n`;
      mensaje += `   Cantidad: ${item.cantidad}\n`;
      mensaje += `   Precio: ${formatMonto(item.precio)} c/u\n`;
      mensaje += `   Subtotal: ${formatMonto(item.precio * item.cantidad)}\n\n`;
    });
    
    mensaje += `*TOTAL: ${formatMonto(totalCarrito)}*\n\n`;
    
    mensaje += `Por favor, indíqueme:\n`;
    mensaje += `✓ Disponibilidad de los productos\n`;
    mensaje += `✓ Costo de envío\n`;
    mensaje += `✓ Métodos de pago disponibles\n\n`;
    
    mensaje += `¡Gracias! 😊`;
    
    return mensaje;
  };

  const generarMensajeCatalogoCompleto = () => {
    let mensaje = `🛍️ *CATÁLOGO DE PRODUCTOS* 🛍️\n\n`;
    mensaje += `*${empresa?.razonSocial || 'Nuestra Tienda'}*\n\n`;
    
    productosFiltrados.forEach((producto, index) => {
      mensaje += `${index + 1}. *${producto.descripcion}*\n`;
      mensaje += `   💰 ${formatMonto(producto.precio)}\n`;
      if (producto.presentacion) {
        mensaje += `   📦 Presentación: ${producto.presentacion}\n`;
      }
      mensaje += `\n`;
    });
    
    mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🚚 *Consulte disponibilidad y envíos*\n`;
    
    if (configuracion.datosPagoMovil) {
      mensaje += `💳 *Aceptamos:* Pago Móvil, Transferencia\n`;
    }
    
    mensaje += `\n¡Escríbanos para hacer su pedido! 📲`;
    
    return mensaje;
  };

  const copiarMensaje = () => {
    const mensaje = generarMensajeWhatsApp();
    navigator.clipboard.writeText(mensaje);
    setCopied(true);
    toast.success('Mensaje copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const abrirWhatsApp = () => {
    const mensaje = encodeURIComponent(generarMensajeWhatsApp());
    const telefono = clienteTelefono ? clienteTelefono.replace(/\D/g, '') : '';
    const url = telefono 
      ? `https://wa.me/${telefono}?text=${mensaje}`
      : `https://wa.me/?text=${mensaje}`;
    window.open(url, '_blank');
  };

  const compartirCatalogo = () => {
    const mensaje = encodeURIComponent(generarMensajeCatalogoCompleto());
    const url = `https://wa.me/?text=${mensaje}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo para WhatsApp</h1>
          <p className="text-slate-500">Comparte tus productos fácilmente</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={compartirCatalogo}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir Catálogo
          </Button>
          <Button onClick={() => setShowCarritoDialog(true)} className="relative">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Ver Pedido
            {carrito.length > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {carrito.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Banner informativo */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8" />
          <div>
            <h3 className="font-bold text-lg">¡Vende por WhatsApp!</h3>
            <p className="text-green-100 text-sm">
              Agrega productos al carrito, genera el mensaje y compártelo con tus clientes en un clic.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar producto..."
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
                  {categorias.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right text-sm text-slate-500">
              {productosFiltrados.length} productos disponibles
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {productosFiltrados.map(producto => (
          <Card key={producto.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                {producto.imagen ? (
                  <img 
                    src={producto.imagen} 
                    alt={producto.descripcion}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-slate-300" />
                )}
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-mono">{producto.codigo}</p>
                  <h3 className="font-medium text-slate-800 line-clamp-2">{producto.descripcion}</h3>
                  
                  {producto.presentacion && (
                    <p className="text-xs text-slate-500">📦 {producto.presentacion}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatMonto(producto.precio)}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => agregarAlCarrito(producto)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <p>No se encontraron productos</p>
        </div>
      )}

      {/* Dialog del Carrito */}
      <Dialog open={showCarritoDialog} onOpenChange={setShowCarritoDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Tu Pedido
            </DialogTitle>
          </DialogHeader>
          
          {carrito.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay productos en el carrito</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCarritoDialog(false)}
              >
                Seguir comprando
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lista de productos */}
              <div className="space-y-3">
                {carrito.map(item => (
                  <div key={item.productoId} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.descripcion}</p>
                      <p className="text-sm text-slate-500">{formatMonto(item.precio)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">{item.cantidad}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="font-medium">{formatMonto(item.precio * item.cantidad)}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-600"
                      onClick={() => eliminarDelCarrito(item.productoId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Total del pedido:</span>
                  <span className="font-bold text-green-600 text-xl">{formatMonto(totalCarrito)}</span>
                </div>
              </div>

              {/* Datos del cliente */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Datos del cliente (opcional)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={clienteNombre}
                      onChange={e => setClienteNombre(e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Teléfono del vendedor</Label>
                    <Input
                      value={clienteTelefono}
                      onChange={e => setClienteTelefono(e.target.value)}
                      placeholder="584141234567"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={copiarMensaje}
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar mensaje'}
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={abrirWhatsApp}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar por WhatsApp
                </Button>
              </div>

              {/* Vista previa del mensaje */}
              <div className="border rounded-lg p-3 bg-slate-50">
                <Label className="text-xs text-slate-500">Vista previa del mensaje:</Label>
                <textarea
                  ref={mensajeRef}
                  value={generarMensajeWhatsApp()}
                  readOnly
                  rows={10}
                  className="w-full mt-2 p-2 text-sm bg-white border rounded resize-none font-mono"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
