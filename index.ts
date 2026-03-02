// Tipos para el Sistema de Facturación Electrónica Venezuela - SENIAT
// Adaptado para Cosmética Natural y Fabricación de Productos

// Empresa (Emisor)
export interface Empresa {
  id: string;
  razonSocial: string;
  rif: string;
  direccion: string;
  telefono: string;
  email: string;
  logo?: string;
  imprentaDigital: {
    nombre: string;
    autorizacion: string;
  };
}

// Cliente (Receptor)
export interface Cliente {
  id: string;
  razonSocial: string;
  rif: string;
  direccion: string;
  telefono?: string;
  email?: string;
  tipo: 'minorista' | 'mayorista' | 'distribuidor' | 'laboratorio';
  fechaRegistro: string;
}

// Tipos de producto
export type TipoProducto = 'producto-terminado' | 'materia-prima' | 'insumo' | 'servicio';

// Producto/Servicio
export interface Producto {
  id: string;
  codigo: string;
  descripcion: string;
  tipo: TipoProducto;
  precio: number;
  costo?: number;
  stock?: number;
  unidad: string;
  activo: boolean;
  imagen?: string; // URL de la imagen del producto
  // Para productos terminados
  formulaId?: string;
  presentacion?: string; // ej: 100ml, 250g, 500ml
  vidaUtil?: number; // días
  // Para materias primas
  lote?: string;
  fechaVencimiento?: string;
}

// Materia Prima (Insumos para producción)
export interface MateriaPrima {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'aceite-vegetal' | 'aceite-esencial' | 'extracto' | 'activo' | 'emulsionante' | 'conservante' | 'otro';
  proveedor?: string;
  stock: number;
  unidad: string; // ml, g, kg, L
  costoUnitario: number;
  fechaIngreso: string;
  lote?: string;
  fechaVencimiento?: string;
  observaciones?: string;
}

// Ingrediente de una fórmula
export interface IngredienteFormula {
  materiaPrimaId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  porcentaje: number;
  costo: number;
}

// Fórmula/Receta de producto
export interface Formula {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'crema' | 'gel' | 'shampoo' | 'acondicionador' | 'aceite' | 'jabon' | 'otro';
  descripcion: string;
  ingredientes: IngredienteFormula[];
  procedimiento: string;
  rendimiento: number; // cantidad que produce (ej: 1000ml)
  unidadRendimiento: string;
  costoTotal: number;
  tiempoPreparacion?: string;
  precauciones?: string;
  fechaCreacion: string;
  activa: boolean;
}

// Lote de Producción
export interface LoteProduccion {
  id: string;
  codigo: string;
  productoId: string;
  nombreProducto: string;
  formulaId?: string;
  cantidadProducida: number;
  unidad: string;
  fechaProduccion: string;
  fechaVencimiento: string;
  responsable?: string;
  observaciones?: string;
  estado: 'en-proceso' | 'terminado' | 'dispersado';
}

// Línea de factura
export interface LineaFactura {
  id: string;
  productoId: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  ivaPorcentaje: number;
  ivaMonto: number;
  total: number;
}

// Tipos de documentos fiscales
export type TipoDocumento = 'factura' | 'nota-debito' | 'nota-credito' | 'guia-despacho' | 'comprobante-retencion';

// Estados de factura
export type EstadoFactura = 'emitida' | 'anulada' | 'pagada' | 'pendiente';

// Factura
export interface Factura {
  id: string;
  numero: string;
  numeroControl: string;
  fecha: string;
  hora: string;
  cliente: Cliente;
  lineas: LineaFactura[];
  subtotal: number;
  descuento: number;
  baseImponible: number;
  iva: number;
  total: number;
  estado: EstadoFactura;
  tipo: TipoDocumento;
  facturaRelacionada?: string;
  motivoNota?: string;
}

// Tipos de pago
export type MetodoPago = 'pago-movil' | 'transferencia' | 'efectivo' | 'punto-venta' | 'zelle' | 'binance';

// Pago de factura
export interface Pago {
  id: string;
  facturaId: string;
  fecha: string;
  monto: number;
  metodo: MetodoPago;
  referencia?: string; // Número de referencia, últimos dígitos, etc.
  banco?: string; // Para transferencias
  telefono?: string; // Para pago móvil
  notas?: string;
}

// Configuración del sistema
export interface Configuracion {
  ivaGeneral: number;
  ivaReducido: number;
  moneda: string;
  prefijoFactura: string;
  ultimoNumero: number;
  formatoFecha: string;
  // Datos para pagos
  datosPagoMovil?: {
    banco: string;
    telefono: string;
    documento: string;
  };
  datosTransferencia?: {
    banco: string;
    cuenta: string;
    titular: string;
    tipo: 'ahorro' | 'corriente';
  };
  datosZelle?: {
    email: string;
    titular: string;
  };
  datosBinance?: {
    id: string;
    qr?: string;
  };
}

// Item para el libro de ventas
export interface LibroVentasItem {
  fecha: string;
  numero: string;
  numeroControl: string;
  cliente: string;
  rif: string;
  total: number;
  baseImponible: number;
  iva: number;
  estado: EstadoFactura;
}

// Resumen para dashboard
export interface ResumenDashboard {
  totalFacturasMes: number;
  montoFacturadoMes: number;
  totalClientes: number;
  totalProductos: number;
  facturasPendientes: number;
}

// Estado del envío
export type EstadoEnvio = 'pendiente' | 'preparando' | 'en-camino' | 'entregado' | 'cancelado' | 'devuelto';

// Método de envío
export type MetodoEnvio = 'delivery-propio' | 'motorizado' | 'transporte' | 'retiro-tienda';

// Envío/Delivery
export interface Envio {
  id: string;
  facturaId: string;
  numeroFactura: string;
  cliente: {
    id: string;
    nombre: string;
    telefono?: string;
    direccion: string;
  };
  fechaEnvio: string;
  fechaEntregaEstimada?: string;
  fechaEntregaReal?: string;
  metodo: MetodoEnvio;
  transportista?: string;
  telefonoTransportista?: string;
  costoEnvio: number;
  estado: EstadoEnvio;
  direccionEntrega: string;
  zona?: string;
  notas?: string;
  referencia?: string; // Punto de referencia para ubicar la dirección
  trackingCode?: string; // Código de seguimiento
}
