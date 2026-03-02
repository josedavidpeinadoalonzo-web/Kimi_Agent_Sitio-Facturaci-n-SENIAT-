import { useState, useRef } from 'react';
import { 
  Tag, 
  Download, 
  Printer, 
  Eye, 
  Palette, 
  Type, 
  Image as ImageIcon,
  RotateCcw,
  Check,
  QrCode,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// Plantillas de etiquetas
const PLANTILLAS = [
  {
    id: 'clasica',
    nombre: 'Clásica Elegante',
    descripcion: 'Diseño limpio y profesional',
    color: '#1e3a5f',
    fondo: '#ffffff',
    preview: 'bg-gradient-to-br from-slate-50 to-white',
  },
  {
    id: 'natural',
    nombre: 'Natural Orgánica',
    descripcion: 'Tonos verdes y naturales',
    color: '#166534',
    fondo: '#f0fdf4',
    preview: 'bg-gradient-to-br from-green-50 to-emerald-50',
  },
  {
    id: 'premium',
    nombre: 'Premium Dorada',
    descripcion: 'Estilo lujoso con dorado',
    color: '#92400e',
    fondo: '#fffbeb',
    preview: 'bg-gradient-to-br from-amber-50 to-yellow-50',
  },
  {
    id: 'minimal',
    nombre: 'Minimalista Moderna',
    descripcion: 'Diseño simple y contemporáneo',
    color: '#374151',
    fondo: '#f9fafb',
    preview: 'bg-gradient-to-br from-gray-50 to-slate-50',
  },
  {
    id: 'botanical',
    nombre: 'Botánica Floral',
    descripcion: 'Inspirada en plantas y flores',
    color: '#7c3aed',
    fondo: '#faf5ff',
    preview: 'bg-gradient-to-br from-purple-50 to-violet-50',
  },
];

// Tamaños de etiqueta personalizados para cosmética natural
const TAMANOS = [
  // Cremas en envases cilíndricos
  { id: 'crema-60g', nombre: 'Crema 60g (3.5x12cm)', ancho: 3.5, alto: 12, tipo: 'crema' },
  { id: 'crema-120g', nombre: 'Crema 120g (4x15cm)', ancho: 4, alto: 15, tipo: 'crema' },
  { id: 'crema-250g', nombre: 'Crema 250g (4x20cm)', ancho: 4, alto: 20, tipo: 'crema' },
  // Aceites
  { id: 'aceite-30ml', nombre: 'Aceite 30ml (6.5x6.5cm)', ancho: 6.5, alto: 6.5, tipo: 'aceite' },
  { id: 'aceite-60ml', nombre: 'Aceite 60ml (9x9cm)', ancho: 9, alto: 9, tipo: 'aceite' },
  // Tamaños estándar adicionales
  { id: 'pequena', nombre: 'Pequeña (5x5cm)', ancho: 5, alto: 5, tipo: 'general' },
  { id: 'mediana', nombre: 'Mediana (6x8cm)', ancho: 6, alto: 8, tipo: 'general' },
  { id: 'grande', nombre: 'Grande (8x10cm)', ancho: 8, alto: 10, tipo: 'general' },
  { id: 'rectangular', nombre: 'Rectangular (10x6cm)', ancho: 10, alto: 6, tipo: 'general' },
];

interface EtiquetaData {
  nombreProducto: string;
  presentacion: string;
  ingredientes: string;
  indicaciones: string;
  contraindicaciones: string;
  precauciones: string;
  lote: string;
  fechaVencimiento: string;
  fechaFabricacion: string;
  registroSanitario: string;
  fabricante: string;
  direccion: string;
  telefono: string;
  email: string;
  paisOrigen: string;
  codigoBarras: string;
  plantilla: string;
  tamano: string;
  incluirQR: boolean;
  incluirLogo: boolean;
}

export function Etiquetas() {
  const { productos, lotes, empresa } = useApp();
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [etiqueta, setEtiqueta] = useState<EtiquetaData>({
    nombreProducto: '',
    presentacion: '',
    ingredientes: '',
    indicaciones: '',
    contraindicaciones: '',
    precauciones: 'Mantener fuera del alcance de los niños.',
    lote: '',
    fechaVencimiento: '',
    fechaFabricacion: '',
    registroSanitario: '',
    fabricante: empresa?.razonSocial || '',
    direccion: empresa?.direccion || '',
    telefono: empresa?.telefono || '',
    email: empresa?.email || '',
    paisOrigen: 'Venezuela',
    codigoBarras: '',
    plantilla: 'clasica',
    tamano: 'crema-60g',
    incluirQR: false,
    incluirLogo: true,
  });

  const [previewScale, setPreviewScale] = useState(1);

  const plantillaActual = PLANTILLAS.find(p => p.id === etiqueta.plantilla) || PLANTILLAS[0];
  const tamanoActual = TAMANOS.find(t => t.id === etiqueta.tamano) || TAMANOS[1];

  const handleChange = (field: keyof EtiquetaData, value: string | boolean) => {
    setEtiqueta(prev => ({ ...prev, [field]: value }));
  };

  const cargarDesdeProducto = (productoId: string) => {
    const producto = productos.find(p => p.id === productoId);
    if (producto) {
      setEtiqueta(prev => ({
        ...prev,
        nombreProducto: producto.descripcion,
        presentacion: producto.presentacion || '',
      }));
      toast.success('Datos del producto cargados');
    }
  };

  const cargarDesdeLote = (loteId: string) => {
    const lote = lotes.find(l => l.id === loteId);
    if (lote) {
      setEtiqueta(prev => ({
        ...prev,
        nombreProducto: lote.nombreProducto,
        lote: lote.codigo,
        fechaFabricacion: lote.fechaProduccion,
        fechaVencimiento: lote.fechaVencimiento || '',
      }));
      toast.success('Datos del lote cargados');
    }
  };

  const generarPDF = () => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [tamanoActual.ancho, tamanoActual.alto],
    });

    // Fondo
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, tamanoActual.ancho, tamanoActual.alto, 'F');

    // Color según plantilla
    const colores: Record<string, { r: number; g: number; b: number }> = {
      clasica: { r: 30, g: 58, b: 95 },
      natural: { r: 22, g: 101, b: 52 },
      premium: { r: 146, g: 64, b: 14 },
      minimal: { r: 55, g: 65, b: 81 },
      botanical: { r: 124, g: 58, b: 237 },
    };

    const color = colores[etiqueta.plantilla] || colores.clasica;

    // Header con color
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(0, 0, tamanoActual.ancho, 8, 'F');

    // Nombre del producto
    doc.setTextColor(color.r, color.g, color.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(etiqueta.nombreProducto || 'PRODUCTO', tamanoActual.ancho / 2, 12, { align: 'center' });

    // Presentación
    if (etiqueta.presentacion) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Contenido: ${etiqueta.presentacion}`, tamanoActual.ancho / 2, 16, { align: 'center' });
    }

    // Línea separadora
    doc.setDrawColor(color.r, color.g, color.b);
    doc.setLineWidth(0.3);
    doc.line(3, 18, tamanoActual.ancho - 3, 18);

    // Ingredientes
    let yPos = 22;
    if (etiqueta.ingredientes) {
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.text('INGREDIENTES:', 3, yPos);
      yPos += 3;
      
      doc.setFont('helvetica', 'normal');
      const ingredientesLines = doc.splitTextToSize(etiqueta.ingredientes, tamanoActual.ancho - 6);
      doc.text(ingredientesLines, 3, yPos);
      yPos += (ingredientesLines.length * 2.5) + 2;
    }

    // Indicaciones
    if (etiqueta.indicaciones && yPos < tamanoActual.alto - 20) {
      doc.setFont('helvetica', 'bold');
      doc.text('INDICACIONES:', 3, yPos);
      yPos += 3;
      
      doc.setFont('helvetica', 'normal');
      const indicacionesLines = doc.splitTextToSize(etiqueta.indicaciones, tamanoActual.ancho - 6);
      doc.text(indicacionesLines, 3, yPos);
      yPos += (indicacionesLines.length * 2.5) + 2;
    }

    // Precauciones
    if (etiqueta.precauciones && yPos < tamanoActual.alto - 15) {
      doc.setFont('helvetica', 'bold');
      doc.text('PRECAUCIONES:', 3, yPos);
      yPos += 3;
      
      doc.setFont('helvetica', 'normal');
      const precaucionesLines = doc.splitTextToSize(etiqueta.precauciones, tamanoActual.ancho - 6);
      doc.text(precaucionesLines, 3, yPos);
      yPos += (precaucionesLines.length * 2.5) + 2;
    }

    // Información del lote (parte inferior)
    const infoY = tamanoActual.alto - 12;
    doc.setFontSize(5);
    
    if (etiqueta.lote) {
      doc.text(`Lote: ${etiqueta.lote}`, 3, infoY);
    }
    if (etiqueta.fechaVencimiento) {
      doc.text(`Vence: ${new Date(etiqueta.fechaVencimiento).toLocaleDateString('es-VE')}`, tamanoActual.ancho / 2, infoY);
    }
    if (etiqueta.fechaFabricacion) {
      doc.text(`Fab: ${new Date(etiqueta.fechaFabricacion).toLocaleDateString('es-VE')}`, 3, infoY + 3);
    }

    // Fabricante
    if (etiqueta.fabricante) {
      doc.text(etiqueta.fabricante, 3, tamanoActual.alto - 4);
    }

    // Guardar PDF
    doc.save(`etiqueta_${etiqueta.nombreProducto.replace(/\s+/g, '_') || 'producto'}.pdf`);
    toast.success('Etiqueta descargada correctamente');
  };

  const imprimirEtiqueta = () => {
    window.print();
  };

  const resetEtiqueta = () => {
    setEtiqueta({
      nombreProducto: '',
      presentacion: '',
      ingredientes: '',
      indicaciones: '',
      contraindicaciones: '',
      precauciones: 'Mantener fuera del alcance de los niños.',
      lote: '',
      fechaVencimiento: '',
      fechaFabricacion: '',
      registroSanitario: '',
      fabricante: empresa?.razonSocial || '',
      direccion: empresa?.direccion || '',
      telefono: empresa?.telefono || '',
      email: empresa?.email || '',
      paisOrigen: 'Venezuela',
      codigoBarras: '',
      plantilla: 'clasica',
      tamano: 'crema-60g',
      incluirQR: false,
      incluirLogo: true,
    });
    toast.success('Etiqueta reiniciada');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-600" />
            Diseño de Etiquetas
          </h1>
          <p className="text-slate-500">Crea etiquetas profesionales para tus productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetEtiqueta}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
          <Button onClick={generarPDF}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de edición */}
        <div className="space-y-4">
          <Tabs defaultValue="datos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="datos">Datos</TabsTrigger>
              <TabsTrigger value="diseno">Diseño</TabsTrigger>
              <TabsTrigger value="cargar">Cargar</TabsTrigger>
            </TabsList>

            {/* Tab: Datos del producto */}
            <TabsContent value="datos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información del Producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del Producto *</Label>
                    <Input
                      value={etiqueta.nombreProducto}
                      onChange={(e) => handleChange('nombreProducto', e.target.value)}
                      placeholder="Ej: Crema Mentolada Natural"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Presentación</Label>
                    <Input
                      value={etiqueta.presentacion}
                      onChange={(e) => handleChange('presentacion', e.target.value)}
                      placeholder="Ej: 100ml / 50g"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ingredientes</Label>
                    <Textarea
                      value={etiqueta.ingredientes}
                      onChange={(e) => handleChange('ingredientes', e.target.value)}
                      placeholder="Liste todos los ingredientes..."
                      rows={4}
                    />
                    <p className="text-xs text-slate-500">
                      Separa los ingredientes con comas. Ej: Aceite de coco, mentol, cera de abejas...
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Indicaciones de Uso</Label>
                    <Textarea
                      value={etiqueta.indicaciones}
                      onChange={(e) => handleChange('indicaciones', e.target.value)}
                      placeholder="Cómo usar el producto..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contraindicaciones</Label>
                    <Textarea
                      value={etiqueta.contraindicaciones}
                      onChange={(e) => handleChange('contraindicaciones', e.target.value)}
                      placeholder="Cuándo no usar el producto..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Precauciones</Label>
                    <Textarea
                      value={etiqueta.precauciones}
                      onChange={(e) => handleChange('precauciones', e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información del Lote</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número de Lote</Label>
                      <Input
                        value={etiqueta.lote}
                        onChange={(e) => handleChange('lote', e.target.value)}
                        placeholder="Ej: CM-20240301-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Registro Sanitario</Label>
                      <Input
                        value={etiqueta.registroSanitario}
                        onChange={(e) => handleChange('registroSanitario', e.target.value)}
                        placeholder="N° de registro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Fabricación</Label>
                      <Input
                        type="date"
                        value={etiqueta.fechaFabricacion}
                        onChange={(e) => handleChange('fechaFabricacion', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Vencimiento</Label>
                      <Input
                        type="date"
                        value={etiqueta.fechaVencimiento}
                        onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Datos del Fabricante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del Fabricante</Label>
                    <Input
                      value={etiqueta.fabricante}
                      onChange={(e) => handleChange('fabricante', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      value={etiqueta.direccion}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={etiqueta.telefono}
                        onChange={(e) => handleChange('telefono', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={etiqueta.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>País de Origen</Label>
                    <Input
                      value={etiqueta.paisOrigen}
                      onChange={(e) => handleChange('paisOrigen', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Diseño */}
            <TabsContent value="diseno" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Plantilla de Diseño
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {PLANTILLAS.map((plantilla) => (
                      <button
                        key={plantilla.id}
                        onClick={() => handleChange('plantilla', plantilla.id)}
                        className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all text-left ${
                          etiqueta.plantilla === plantilla.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div 
                          className={`w-12 h-12 rounded-lg ${plantilla.preview} flex items-center justify-center`}
                          style={{ borderColor: plantilla.color, borderWidth: 2 }}
                        >
                          <Tag className="h-6 w-6" style={{ color: plantilla.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{plantilla.nombre}</p>
                          <p className="text-sm text-slate-500">{plantilla.descripcion}</p>
                        </div>
                        {etiqueta.plantilla === plantilla.id && (
                          <Check className="h-5 w-5 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Tamaño de Etiqueta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={etiqueta.tamano} 
                    onValueChange={(v) => handleChange('tamano', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAMANOS.map((tamano) => (
                        <SelectItem key={tamano.id} value={tamano.id}>
                          {tamano.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Opciones Adicionales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-slate-500" />
                      <Label className="cursor-pointer">Incluir código QR</Label>
                    </div>
                    <input
                      type="checkbox"
                      checked={etiqueta.incluirQR}
                      onChange={(e) => handleChange('incluirQR', e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-slate-500" />
                      <Label className="cursor-pointer">Incluir logo de empresa</Label>
                    </div>
                    <input
                      type="checkbox"
                      checked={etiqueta.incluirLogo}
                      onChange={(e) => handleChange('incluirLogo', e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Cargar datos */}
            <TabsContent value="cargar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cargar desde Producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Selecciona un producto para cargar sus datos automáticamente.
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {productos.filter(p => p.activo).map((producto) => (
                      <button
                        key={producto.id}
                        onClick={() => cargarDesdeProducto(producto.id)}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 text-left"
                      >
                        <div>
                          <p className="font-medium">{producto.descripcion}</p>
                          <p className="text-sm text-slate-500">{producto.codigo}</p>
                        </div>
                        <Badge variant="outline">{producto.presentacion || 'N/A'}</Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cargar desde Lote</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Selecciona un lote para cargar sus datos incluyendo número de lote y fechas.
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {lotes.slice(0, 20).map((lote) => (
                      <button
                        key={lote.id}
                        onClick={() => cargarDesdeLote(lote.id)}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 text-left"
                      >
                        <div>
                          <p className="font-medium">{lote.nombreProducto}</p>
                          <p className="text-sm text-slate-500">{lote.codigo}</p>
                        </div>
                        <Badge variant={lote.estado === 'terminado' ? 'default' : 'secondary'}>
                          {lote.estado}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel de vista previa */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vista Previa
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={imprimirEtiqueta}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4 bg-slate-100 rounded-lg overflow-auto">
                <div
                  ref={previewRef}
                  className={`relative shadow-lg transition-all duration-300 ${plantillaActual.preview}`}
                  style={{
                    width: `${tamanoActual.ancho * 30 * previewScale}px`,
                    height: `${tamanoActual.alto * 30 * previewScale}px`,
                    minWidth: '200px',
                    minHeight: '200px',
                  }}
                >
                  {/* Header */}
                  <div 
                    className="h-8 w-full flex items-center justify-center"
                    style={{ backgroundColor: plantillaActual.color }}
                  >
                    {etiqueta.incluirLogo && (
                      <span className="text-white text-xs font-bold">★</span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-3 space-y-2" style={{ fontSize: `${10 * previewScale}px` }}>
                    {/* Nombre del producto */}
                    <h3 
                      className="font-bold text-center leading-tight"
                      style={{ color: plantillaActual.color, fontSize: `${12 * previewScale}px` }}
                    >
                      {etiqueta.nombreProducto || 'NOMBRE DEL PRODUCTO'}
                    </h3>

                    {/* Presentación */}
                    {etiqueta.presentacion && (
                      <p className="text-center text-slate-600">
                        Contenido: {etiqueta.presentacion}
                      </p>
                    )}

                    {/* Línea separadora */}
                    <div 
                      className="h-px w-full my-2"
                      style={{ backgroundColor: plantillaActual.color }}
                    />

                    {/* Ingredientes */}
                    {etiqueta.ingredientes && (
                      <div>
                        <p className="font-bold text-slate-700">INGREDIENTES:</p>
                        <p className="text-slate-600 text-xs leading-tight">
                          {etiqueta.ingredientes}
                        </p>
                      </div>
                    )}

                    {/* Indicaciones */}
                    {etiqueta.indicaciones && (
                      <div>
                        <p className="font-bold text-slate-700">INDICACIONES:</p>
                        <p className="text-slate-600 text-xs leading-tight">
                          {etiqueta.indicaciones}
                        </p>
                      </div>
                    )}

                    {/* Precauciones */}
                    {etiqueta.precauciones && (
                      <div>
                        <p className="font-bold text-slate-700">PRECAUCIONES:</p>
                        <p className="text-slate-600 text-xs leading-tight">
                          {etiqueta.precauciones}
                        </p>
                      </div>
                    )}

                    {/* Info del lote */}
                    <div className="pt-2 mt-2 border-t border-slate-200">
                      <div className="flex justify-between text-xs text-slate-500">
                        {etiqueta.lote && <span>Lote: {etiqueta.lote}</span>}
                        {etiqueta.fechaVencimiento && (
                          <span>
                            Vence: {new Date(etiqueta.fechaVencimiento).toLocaleDateString('es-VE')}
                          </span>
                        )}
                      </div>
                      {etiqueta.fechaFabricacion && (
                        <p className="text-xs text-slate-500">
                          Fab: {new Date(etiqueta.fechaFabricacion).toLocaleDateString('es-VE')}
                        </p>
                      )}
                    </div>

                    {/* Fabricante */}
                    {etiqueta.fabricante && (
                      <div className="pt-1 text-center">
                        <p className="text-xs font-medium text-slate-700">{etiqueta.fabricante}</p>
                        {etiqueta.paisOrigen && (
                          <p className="text-xs text-slate-500">Hecho en {etiqueta.paisOrigen}</p>
                        )}
                      </div>
                    )}

                    {/* QR Code placeholder */}
                    {etiqueta.incluirQR && (
                      <div className="flex justify-center pt-2">
                        <div className="w-12 h-12 border-2 border-slate-300 rounded flex items-center justify-center">
                          <QrCode className="h-8 w-8 text-slate-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Controles de zoom */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.25))}
                >
                  -
                </Button>
                <span className="text-sm text-slate-600">
                  Zoom: {Math.round(previewScale * 100)}%
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPreviewScale(Math.min(2, previewScale + 0.25))}
                >
                  +
                </Button>
              </div>

              {/* Info del tamaño */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-600">
                  Tamaño real: <strong>{tamanoActual.ancho}cm x {tamanoActual.alto}cm</strong>
                </p>
                <p className="text-xs text-slate-500">
                  {tamanoActual.nombre}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plantillas sugeridas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plantillas Recomendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Para productos naturales</p>
                    <p className="text-sm text-green-700">
                      Usa la plantilla "Natural Orgánica" para resaltar los ingredientes naturales.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Para línea premium</p>
                    <p className="text-sm text-amber-700">
                      La plantilla "Premium Dorada" transmite lujo y calidad superior.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Para uso profesional</p>
                    <p className="text-sm text-blue-700">
                      La plantilla "Clásica Elegante" es ideal para spas y centros de estética.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
