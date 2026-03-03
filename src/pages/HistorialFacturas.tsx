import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Eye,
  Download,
  FileText,
  Ban,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Factura } from '@/types';

export function HistorialFacturas() {
  const { facturas, empresa, configuracion, updateFactura, addFactura } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNotaDialog, setShowNotaDialog] = useState(false);
  const [tipoNota, setTipoNota] = useState<'nota-debito' | 'nota-credito'>('nota-credito');
  const [montoNota, setMontoNota] = useState('');
  const [motivoNota, setMotivoNota] = useState('');
  const facturaRef = useRef<HTMLDivElement>(null);

  const filteredFacturas = facturas
    .filter(f => {
      const matchesSearch =
        f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cliente.rif.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEstado = filtroEstado === 'todos' || f.estado === filtroEstado;
      
      const matchesFecha =
        (!fechaDesde || f.fecha >= fechaDesde) &&
        (!fechaHasta || f.fecha <= fechaHasta);
      
      return matchesSearch && matchesEstado && matchesFecha;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const handleViewDetail = (factura: Factura) => {
    setSelectedFactura(factura);
    setShowDetailDialog(true);
  };

  const handleDownloadPDF = async (factura: Factura) => {
    setSelectedFactura(factura);
    setShowDetailDialog(true);
    
    // Esperar a que el diálogo se abra y el DOM se actualice
    setTimeout(async () => {
      if (!facturaRef.current) return;
      
      const canvas = await html2canvas(facturaRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'letter');
      
      // Dimensiones de página carta en mm
      const pageWidth = 216;
      const pageHeight = 279;
      
      // Calcular dimensiones de la imagen
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Si la factura cabe en una página
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Factura larga - dividir en múltiples páginas
        let heightLeft = imgHeight;
        let position = 0;
        
        // Primera página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Páginas adicionales si es necesario
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      pdf.save(`FACTURA-${factura.numero}.pdf`);
    }, 500);
  };

  const handleAnularFactura = (factura: Factura) => {
    if (confirm(`¿Está seguro de ANULAR la factura N° ${factura.numero}?\n\nEsta acción no se puede deshacer.`)) {
      updateFactura(factura.id, { estado: 'anulada' });
      toast.success(`Factura N° ${factura.numero} anulada correctamente`);
    }
  };

  const handleMarcarPagada = (factura: Factura) => {
    updateFactura(factura.id, { estado: 'pagada' });
    toast.success(`Factura N° ${factura.numero} marcada como pagada`);
  };

  const handleEmitirNota = () => {
    if (!selectedFactura) return;
    
    const monto = parseFloat(montoNota);
    if (isNaN(monto) || monto <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }
    if (!motivoNota.trim()) {
      toast.error('Debe indicar el motivo');
      return;
    }

    const iva = monto * (configuracion.ivaGeneral / 100);
    
    addFactura({
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-VE'),
      cliente: selectedFactura.cliente,
      lineas: [
        {
          id: crypto.randomUUID(),
          productoId: 'nota',
          codigo: tipoNota === 'nota-credito' ? 'N/C' : 'N/D',
          descripcion: `${tipoNota === 'nota-credito' ? 'Nota de Crédito' : 'Nota de Débito'} - Factura ${selectedFactura.numero} - ${motivoNota}`,
          cantidad: 1,
          precioUnitario: monto,
          subtotal: monto,
          ivaPorcentaje: configuracion.ivaGeneral,
          ivaMonto: iva,
          total: monto + iva,
        },
      ],
      subtotal: monto,
      descuento: 0,
      baseImponible: monto,
      iva,
      total: monto + iva,
      estado: 'emitida',
      tipo: tipoNota,
      facturaRelacionada: selectedFactura.id,
      motivoNota: motivoNota,
    });

    toast.success(`${tipoNota === 'nota-credito' ? 'Nota de Crédito' : 'Nota de Débito'} emitida correctamente`);
    setShowNotaDialog(false);
    setMontoNota('');
    setMotivoNota('');
  };

  const openNotaDialog = (factura: Factura, tipo: 'nota-debito' | 'nota-credito') => {
    setSelectedFactura(factura);
    setTipoNota(tipo);
    setShowNotaDialog(true);
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historial de Facturas</h1>
          <p className="text-slate-500">Consulte y descargue sus facturas emitidas</p>
        </div>
        <Link to="/facturas/nueva">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar factura..."
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
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="anulada">Anulada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                placeholder="Desde"
              />
            </div>
            <div>
              <Input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                placeholder="Hasta"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de facturas */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas Emitidas ({filteredFacturas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFacturas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay facturas registradas</p>
              <Link to="/facturas/nueva">
                <Button variant="outline" className="mt-4">
                  Emitir primera factura
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Número</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Control</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Cliente</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacturas.map(factura => (
                    <tr key={factura.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium">{factura.numero}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{factura.numeroControl}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{formatFecha(factura.fecha)}</td>
                      <td className="py-3 px-4 text-sm">{factura.cliente.razonSocial}</td>
                      <td className="py-3 px-4 text-sm text-right font-mono">
                        {formatMonto(factura.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            factura.estado === 'pagada'
                              ? 'bg-green-100 text-green-700'
                              : factura.estado === 'pendiente'
                              ? 'bg-amber-100 text-amber-700'
                              : factura.estado === 'anulada'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {factura.estado.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Ver detalle */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(factura)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Descargar PDF */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(factura)}
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {/* Acciones solo para facturas no anuladas */}
                          {factura.estado !== 'anulada' && factura.tipo === 'factura' && (
                            <>
                              {/* Marcar como pagada */}
                              {factura.estado !== 'pagada' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMarcarPagada(factura)}
                                  title="Marcar como pagada"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {/* Nota de Crédito */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openNotaDialog(factura, 'nota-credito')}
                                title="Emitir Nota de Crédito"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ArrowDownCircle className="h-4 w-4" />
                              </Button>
                              
                              {/* Nota de Débito */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openNotaDialog(factura, 'nota-debito')}
                                title="Emitir Nota de Débito"
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <ArrowUpCircle className="h-4 w-4" />
                              </Button>
                              
                              {/* Anular */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAnularFactura(factura)}
                                title="Anular factura"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* Dialog de detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Factura</DialogTitle>
          </DialogHeader>
          {selectedFactura && empresa && (
            <div ref={facturaRef} className="bg-white" style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
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
                  <p style={{ fontSize: '14px', color: '#4a5568', margin: '8px 0 4px 0' }}>N° <strong>{selectedFactura.numero}</strong></p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Control: <strong>{selectedFactura.numeroControl}</strong></p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Fecha: {formatFecha(selectedFactura.fecha)}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Hora: {selectedFactura.hora}</p>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1e3a5f' }}>
                <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Datos del Cliente / Receptor</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a202c', margin: '0 0 4px 0' }}>{selectedFactura.cliente.razonSocial}</p>
                <p style={{ fontSize: '12px', color: '#4a5568', margin: '0 0 4px 0' }}>RIF: {selectedFactura.cliente.rif}</p>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{selectedFactura.cliente.direccion}</p>
                {selectedFactura.cliente.telefono && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Tel: {selectedFactura.cliente.telefono}</p>}
              </div>

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
                  {selectedFactura.lineas.map((linea, index) => (
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
                    <span style={{ fontFamily: 'monospace', color: '#1a202c' }}>{formatMonto(selectedFactura.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: '#4a5568' }}>Base Imponible:</span>
                    <span style={{ fontFamily: 'monospace', color: '#1a202c' }}>{formatMonto(selectedFactura.baseImponible)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: '#4a5568' }}>IVA ({configuracion.ivaGeneral}%):</span>
                    <span style={{ fontFamily: 'monospace', color: '#1a202c' }}>{formatMonto(selectedFactura.iva)}</span>
                  </div>
                  {selectedFactura.descuento > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                      <span style={{ color: '#4a5568' }}>Descuento:</span>
                      <span style={{ fontFamily: 'monospace', color: '#dc2626' }}>-{formatMonto(selectedFactura.descuento)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #1e3a5f' }}>
                    <span style={{ color: '#1e3a5f' }}>TOTAL A PAGAR:</span>
                    <span style={{ fontFamily: 'monospace', color: '#1e3a5f' }}>{formatMonto(selectedFactura.total)}</span>
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
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para emitir Nota de Débito/Crédito */}
      <Dialog open={showNotaDialog} onOpenChange={setShowNotaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tipoNota === 'nota-credito' ? 'Emitir Nota de Crédito' : 'Emitir Nota de Débito'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedFactura && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Factura: {selectedFactura.numero}</p>
                <p className="text-sm text-slate-600">{selectedFactura.cliente.razonSocial}</p>
                <p className="text-sm text-slate-600">
                  Total original: {formatMonto(selectedFactura.total)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Monto <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={montoNota}
                onChange={e => setMontoNota(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivoNota}
                onChange={e => setMotivoNota(e.target.value)}
                placeholder="Indique el motivo de la corrección"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                {tipoNota === 'nota-credito' 
                  ? 'La Nota de Crédito disminuye el monto de la factura original.' 
                  : 'La Nota de Débito aumenta el monto de la factura original.'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowNotaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEmitirNota}>
              {tipoNota === 'nota-credito' ? 'Emitir Nota de Crédito' : 'Emitir Nota de Débito'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
