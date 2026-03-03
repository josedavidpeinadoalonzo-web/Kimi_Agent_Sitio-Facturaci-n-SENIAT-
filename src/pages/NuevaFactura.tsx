import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Search,
  Save,
  Download,
  FileText,
  AlertCircle,
  User,
  Package,
  Calculator,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Cliente, Producto, LineaFactura } from '@/types';

export function NuevaFactura() {
  const navigate = useNavigate();
  const { empresa, clientes, productos, configuracion, addFactura, getNextNumeroFactura } = useApp();
  const facturaRef = useRef<HTMLDivElement>(null);

  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [lineas, setLineas] = useState<LineaFactura[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [showProductoDialog, setShowProductoDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [productoSearch, setProductoSearch] = useState('');

  const filteredClientes = clientes.filter(
    c =>
      c.razonSocial.toLowerCase().includes(clienteSearch.toLowerCase()) ||
      c.rif.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const filteredProductos = productos.filter(
    p =>
      p.activo &&
      (p.descripcion.toLowerCase().includes(productoSearch.toLowerCase()) ||
        p.codigo.toLowerCase().includes(productoSearch.toLowerCase()))
  );

  const subtotal = lineas.reduce((sum, l) => sum + l.subtotal, 0);
  const iva = lineas.reduce((sum, l) => sum + l.ivaMonto, 0);
  const total = subtotal + iva - descuento;

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowClienteDialog(false);
    setClienteSearch('');
  };

  const handleAddProducto = (producto: Producto) => {
    const existingLine = lineas.find(l => l.productoId === producto.id);
    if (existingLine) {
      // Incrementar cantidad si ya existe
      handleUpdateCantidad(existingLine.id, existingLine.cantidad + 1);
    } else {
      const ivaPorcentaje = configuracion.ivaGeneral;
      const subtotal = producto.precio;
      const ivaMonto = subtotal * (ivaPorcentaje / 100);
      const nuevaLinea: LineaFactura = {
        id: crypto.randomUUID(),
        productoId: producto.id,
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal,
        ivaPorcentaje,
        ivaMonto,
        total: subtotal + ivaMonto,
      };
      setLineas(prev => [...prev, nuevaLinea]);
    }
    setShowProductoDialog(false);
    setProductoSearch('');
  };

  const handleUpdateCantidad = (lineaId: string, cantidad: number) => {
    if (cantidad <= 0) {
      handleRemoveLinea(lineaId);
      return;
    }
    setLineas(prev =>
      prev.map(l => {
        if (l.id === lineaId) {
          const subtotal = cantidad * l.precioUnitario;
          const ivaMonto = subtotal * (l.ivaPorcentaje / 100);
          return {
            ...l,
            cantidad,
            subtotal,
            ivaMonto,
            total: subtotal + ivaMonto,
          };
        }
        return l;
      })
    );
  };

  const handleRemoveLinea = (lineaId: string) => {
    setLineas(prev => prev.filter(l => l.id !== lineaId));
  };

  const handleEmitirFactura = () => {
    if (!selectedCliente) {
      toast.error('Debe seleccionar un cliente');
      return;
    }
    if (lineas.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    // Mostrar vista previa antes de emitir
    setShowPreview(true);
  };

  const confirmarYDescargar = async () => {
    if (!selectedCliente) return;

    addFactura({
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-VE'),
      cliente: selectedCliente,
      lineas,
      subtotal,
      descuento,
      baseImponible: subtotal - descuento,
      iva,
      total,
      estado: 'emitida',
      tipo: 'factura',
    });

    toast.success('Factura emitida correctamente');
    
    // Generar PDF
    await generarPDF();
    
    setShowPreview(false);
    navigate('/facturas/historial');
  };

  const generarPDF = async () => {
    if (!facturaRef.current) return;
    
    const canvas = await html2canvas(facturaRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'letter');
    const imgWidth = 216;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`FACTURA-${getNextNumeroFactura()}.pdf`);
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  if (!empresa) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
        <p>Debe configurar los datos de la empresa primero</p>
        <Button className="mt-4" onClick={() => navigate('/configuracion')}>
          Ir a Configuración
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nueva Factura</h1>
          <p className="text-slate-500">Emisión de factura electrónica SENIAT</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Vista Previa
          </Button>
          <Button onClick={handleEmitirFactura}>
            <Save className="mr-2 h-4 w-4" />
            Emitir Factura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos del Cliente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCliente ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold">{selectedCliente.razonSocial}</p>
                    <p className="text-slate-600">{selectedCliente.rif}</p>
                    <p className="text-slate-500 text-sm mt-1">{selectedCliente.direccion}</p>
                    {selectedCliente.telefono && (
                      <p className="text-slate-500 text-sm">{selectedCliente.telefono}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCliente(null)}>
                    Cambiar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full py-8" onClick={() => setShowClienteDialog(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Seleccionar Cliente
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-mono">{formatMonto(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">IVA ({configuracion.ivaGeneral}%):</span>
              <span className="font-mono">{formatMonto(iva)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Descuento:</span>
              <Input
                type="number"
                min={0}
                max={subtotal}
                value={descuento}
                onChange={e => setDescuento(Number(e.target.value))}
                className="w-32 text-right font-mono"
              />
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span className="font-mono text-blue-600">{formatMonto(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Líneas de Factura */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos / Servicios
          </CardTitle>
          <Button onClick={() => setShowProductoDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {lineas.length === 0 ? (
            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay productos agregados</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowProductoDialog(true)}>
                Agregar producto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Descripción</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Cant.</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Precio</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Subtotal</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">IVA</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map(linea => (
                    <tr key={linea.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm font-mono">{linea.codigo}</td>
                      <td className="py-3 px-4 text-sm">{linea.descripcion}</td>
                      <td className="py-3 px-4 text-center">
                        <Input
                          type="number"
                          min={1}
                          value={linea.cantidad}
                          onChange={e => handleUpdateCantidad(linea.id, Number(e.target.value))}
                          className="w-20 text-center"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono">
                        {formatMonto(linea.precioUnitario)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono">
                        {formatMonto(linea.subtotal)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono">
                        {formatMonto(linea.ivaMonto)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono font-medium">
                        {formatMonto(linea.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLinea(linea.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para seleccionar cliente */}
      <Dialog open={showClienteDialog} onOpenChange={setShowClienteDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o RIF..."
                value={clienteSearch}
                onChange={e => setClienteSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-96 space-y-2">
              {filteredClientes.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No se encontraron clientes</p>
              ) : (
                filteredClientes.map(cliente => (
                  <button
                    key={cliente.id}
                    onClick={() => handleSelectCliente(cliente)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-colors"
                  >
                    <p className="font-medium">{cliente.razonSocial}</p>
                    <p className="text-sm text-slate-600">{cliente.rif}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para seleccionar producto */}
      <Dialog open={showProductoDialog} onOpenChange={setShowProductoDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por código o descripción..."
                value={productoSearch}
                onChange={e => setProductoSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-96 space-y-2">
              {filteredProductos.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No se encontraron productos</p>
              ) : (
                filteredProductos.map(producto => (
                  <button
                    key={producto.id}
                    onClick={() => handleAddProducto(producto)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{producto.descripcion}</p>
                        <p className="text-sm text-slate-600">{producto.codigo}</p>
                      </div>
                      <p className="font-mono font-medium">{formatMonto(producto.precio)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Vista Previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Vista Previa de Factura</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 overflow-auto">
            <div ref={facturaRef} className="bg-white mx-auto" style={{ width: '816px', padding: '40px', fontFamily: 'Arial, sans-serif', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
              {/* Header con Logo y Datos de Factura */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '3px solid #1e3a5f', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {empresa.logo && (
                    <img 
                      src={empresa.logo} 
                      alt="Logo" 
                      style={{ height: '80px', width: '80px', objectFit: 'contain' }}
                    />
                  )}
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f', margin: 0 }}>{empresa.razonSocial}</h2>
                    <p style={{ fontSize: '12px', color: '#4a5568', margin: '4px 0' }}>RIF: {empresa.rif}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0', maxWidth: '300px' }}>{empresa.direccion}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>Tel: {empresa.telefono}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>{empresa.email}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '2px solid #1e3a5f' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a5f', margin: 0, letterSpacing: '2px' }}>FACTURA</h1>
                  <p style={{ fontSize: '14px', color: '#4a5568', margin: '8px 0 4px 0' }}>N° <strong>{getNextNumeroFactura()}</strong></p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Control: <strong>{configuracion.prefijoFactura}-{getNextNumeroFactura()}</strong></p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Fecha: {new Date().toLocaleDateString('es-VE')}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Hora: {new Date().toLocaleTimeString('es-VE')}</p>
                </div>
              </div>

              {/* Datos del Cliente */}
              {selectedCliente && (
                <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1e3a5f' }}>
                  <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Datos del Cliente / Receptor</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a202c', margin: '0 0 4px 0' }}>{selectedCliente.razonSocial}</p>
                  <p style={{ fontSize: '12px', color: '#4a5568', margin: '0 0 4px 0' }}>RIF: {selectedCliente.rif}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{selectedCliente.direccion}</p>
                  {selectedCliente.telefono && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Tel: {selectedCliente.telefono}</p>}
                </div>
              )}

              {/* Tabla de productos */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
                    <th style={{ border: '1px solid #1e3a5f', padding: '10px 8px', textAlign: 'center', width: '50px' }}>N°</th>
                    <th style={{ border: '1px solid #1e3a5f', padding: '10px 8px', textAlign: 'left', width: '80px' }}>Código</th>
                    <th style={{ border: '1px solid #1e3a5f', padding: '10px 8px', textAlign: 'left' }}>Descripción</th>
                    <th style={{ border: '1px solid #1e3a5f', padding: '10px 8px', textAlign: 'center', width: '60px' }}>Cant.</th>
                    <th style={{ border: '1px solid #1e3a5f', padding: '10px 8px', textAlign: 'right', width: '100px' }}>Precio Unit.</th>
                    <th style={{ border: '1px solid #1e3a5f', padding: '10px 8px', textAlign: 'right', width: '100px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea, index) => (
                    <tr key={linea.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontFamily: 'monospace' }}>{linea.codigo}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{linea.descripcion}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{linea.cantidad}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                        {formatMonto(linea.precioUnitario)}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                        {formatMonto(linea.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '2px solid #1e3a5f' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: '#4a5568' }}>Subtotal:</span>
                    <span style={{ fontFamily: 'monospace', color: '#1a202c' }}>{formatMonto(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: '#4a5568' }}>Base Imponible:</span>
                    <span style={{ fontFamily: 'monospace', color: '#1a202c' }}>{formatMonto(subtotal - descuento)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: '#4a5568' }}>IVA ({configuracion.ivaGeneral}%):</span>
                    <span style={{ fontFamily: 'monospace', color: '#1a202c' }}>{formatMonto(iva)}</span>
                  </div>
                  {descuento > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                      <span style={{ color: '#4a5568' }}>Descuento:</span>
                      <span style={{ fontFamily: 'monospace', color: '#dc2626' }}>-{formatMonto(descuento)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #1e3a5f' }}>
                    <span style={{ color: '#1e3a5f' }}>TOTAL A PAGAR:</span>
                    <span style={{ fontFamily: 'monospace', color: '#1e3a5f' }}>{formatMonto(total)}</span>
                  </div>
                </div>
              </div>

              {/* Información de imprenta */}
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b' }}>
                <p style={{ fontSize: '10px', color: '#92400e', margin: 0, textAlign: 'center' }}>
                  <strong>Imprenta Autorizada:</strong> {empresa.imprentaDigital.nombre} | 
                  <strong> Autorización SENIAT:</strong> {empresa.imprentaDigital.autorizacion}
                </p>
              </div>

              {/* Leyenda legal */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', fontSize: '9px', color: '#64748b', textAlign: 'center', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 4px 0' }}>
                  <strong>DOCUMENTO EMITIDO CONFORME A LA PROVIDENCIA ADMINISTRATIVA SNAT/2014/0032</strong>
                </p>
                <p style={{ margin: '0 0 4px 0' }}>
                  Esta factura es un documento fiscal válido según la legislación venezolana vigente.
                </p>
                <p style={{ margin: 0 }}>
                  La alteración, falsificación o reproducción no autorizada de este documento constituye un delito tipificado en el Código Penal vigente.
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarYDescargar}>
              <Download className="mr-2 h-4 w-4" />
              Confirmar y Descargar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
