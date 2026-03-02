import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Empresa, Cliente, Producto, Factura, Configuracion, ResumenDashboard, MateriaPrima, Formula, LoteProduccion, Pago, Envio } from '@/types';

interface AppState {
  empresa: Empresa | null;
  clientes: Cliente[];
  productos: Producto[];
  facturas: Factura[];
  materiasPrimas: MateriaPrima[];
  formulas: Formula[];
  lotes: LoteProduccion[];
  pagos: Pago[];
  envios: Envio[];
  configuracion: Configuracion;
}

interface AppContextType extends AppState {
  // Empresa
  setEmpresa: (empresa: Empresa) => void;
  updateEmpresa: (empresa: Partial<Empresa>) => void;
  
  // Clientes
  addCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => void;
  updateCliente: (id: string, cliente: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  getClienteById: (id: string) => Cliente | undefined;
  getClienteByRif: (rif: string) => Cliente | undefined;
  
  // Productos
  addProducto: (producto: Omit<Producto, 'id'>) => void;
  updateProducto: (id: string, producto: Partial<Producto>) => void;
  deleteProducto: (id: string) => void;
  getProductoById: (id: string) => Producto | undefined;
  getProductoByCodigo: (codigo: string) => Producto | undefined;
  generarCodigoProducto: (nombre: string) => string;
  
  // Facturas
  addFactura: (factura: Omit<Factura, 'id' | 'numero' | 'numeroControl'>) => Factura;
  updateFactura: (id: string, factura: Partial<Factura>) => void;
  deleteFactura: (id: string) => void;
  getFacturaById: (id: string) => Factura | undefined;
  getNextNumeroFactura: () => string;
  
  // Materias Primas
  addMateriaPrima: (mp: Omit<MateriaPrima, 'id'>) => void;
  updateMateriaPrima: (id: string, mp: Partial<MateriaPrima>) => void;
  deleteMateriaPrima: (id: string) => void;
  getMateriaPrimaById: (id: string) => MateriaPrima | undefined;
  
  // Fórmulas
  addFormula: (formula: Omit<Formula, 'id' | 'fechaCreacion'>) => void;
  updateFormula: (id: string, formula: Partial<Formula>) => void;
  deleteFormula: (id: string) => void;
  getFormulaById: (id: string) => Formula | undefined;
  calcularCostoFormula: (ingredientes: Formula['ingredientes']) => number;
  
  // Lotes de Producción
  addLote: (lote: Omit<LoteProduccion, 'id'>) => void;
  updateLote: (id: string, lote: Partial<LoteProduccion>) => void;
  deleteLote: (id: string) => void;
  getLotesByProducto: (productoId: string) => LoteProduccion[];
  getLotesProximosVencer: (dias: number) => LoteProduccion[];
  
  // Pagos
  addPago: (pago: Omit<Pago, 'id'>) => void;
  deletePago: (id: string) => void;
  getPagosByFactura: (facturaId: string) => Pago[];
  getTotalPagado: (facturaId: string) => number;
  getSaldoPendiente: (facturaId: string) => number;
  
  // Envíos
  addEnvio: (envio: Omit<Envio, 'id'>) => void;
  updateEnvio: (id: string, envio: Partial<Envio>) => void;
  deleteEnvio: (id: string) => void;
  getEnvioByFactura: (facturaId: string) => Envio | undefined;
  getEnviosByEstado: (estado: Envio['estado']) => Envio[];
  getEnviosPendientes: () => Envio[];
  
  // Configuración
  updateConfiguracion: (config: Partial<Configuracion>) => void;
  
  // Resumen
  getResumenDashboard: () => ResumenDashboard;
  getLibroVentas: (fechaInicio: string, fechaFin: string) => Factura[];
}

const defaultConfiguracion: Configuracion = {
  ivaGeneral: 16,
  ivaReducido: 8,
  moneda: 'VES',
  prefijoFactura: 'FAC',
  ultimoNumero: 0,
  formatoFecha: 'DD/MM/YYYY',
};

const defaultEmpresa: Empresa = {
  id: '1',
  razonSocial: 'MI EMPRECIA C.A.',
  rif: 'J-12345678-9',
  direccion: 'Av. Principal, Edificio Centro, Piso 1, Oficina 101, Caracas, Venezuela',
  telefono: '(0212) 555-1234',
  email: 'facturacion@miempresa.com',
  imprentaDigital: {
    nombre: 'IMPRENTA DIGITAL SENIAT C.A.',
    autorizacion: 'SENIAT-IMP-2024-001',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresaState] = useState<Empresa | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [lotes, setLotes] = useState<LoteProduccion[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion>(defaultConfiguracion);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar datos desde LocalStorage al iniciar
  useEffect(() => {
    const loadData = () => {
      try {
        const storedEmpresa = localStorage.getItem('seniat_empresa');
        const storedClientes = localStorage.getItem('seniat_clientes');
        const storedProductos = localStorage.getItem('seniat_productos');
        const storedFacturas = localStorage.getItem('seniat_facturas');
        const storedMateriasPrimas = localStorage.getItem('seniat_materiasprimas');
        const storedFormulas = localStorage.getItem('seniat_formulas');
        const storedLotes = localStorage.getItem('seniat_lotes');
        const storedPagos = localStorage.getItem('seniat_pagos');
        const storedEnvios = localStorage.getItem('seniat_envios');
        const storedConfig = localStorage.getItem('seniat_config');

        if (storedEmpresa) setEmpresaState(JSON.parse(storedEmpresa));
        else setEmpresaState(defaultEmpresa);
        
        if (storedClientes) setClientes(JSON.parse(storedClientes));
        if (storedProductos) setProductos(JSON.parse(storedProductos));
        if (storedFacturas) setFacturas(JSON.parse(storedFacturas));
        if (storedMateriasPrimas) setMateriasPrimas(JSON.parse(storedMateriasPrimas));
        if (storedFormulas) setFormulas(JSON.parse(storedFormulas));
        if (storedLotes) setLotes(JSON.parse(storedLotes));
        if (storedPagos) setPagos(JSON.parse(storedPagos));
        if (storedEnvios) setEnvios(JSON.parse(storedEnvios));
        if (storedConfig) setConfiguracion(JSON.parse(storedConfig));
      } catch (error) {
        console.error('Error cargando datos:', error);
        setEmpresaState(defaultEmpresa);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Guardar datos en LocalStorage cuando cambien
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_empresa', JSON.stringify(empresa));
  }, [empresa, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_clientes', JSON.stringify(clientes));
  }, [clientes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_productos', JSON.stringify(productos));
  }, [productos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_facturas', JSON.stringify(facturas));
  }, [facturas, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_materiasprimas', JSON.stringify(materiasPrimas));
  }, [materiasPrimas, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_formulas', JSON.stringify(formulas));
  }, [formulas, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_lotes', JSON.stringify(lotes));
  }, [lotes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_pagos', JSON.stringify(pagos));
  }, [pagos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_envios', JSON.stringify(envios));
  }, [envios, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('seniat_config', JSON.stringify(configuracion));
  }, [configuracion, isLoaded]);

  // Funciones de Empresa
  const setEmpresa = (nuevaEmpresa: Empresa) => {
    setEmpresaState(nuevaEmpresa);
  };

  const updateEmpresa = (updates: Partial<Empresa>) => {
    setEmpresaState(prev => prev ? { ...prev, ...updates } : null);
  };

  // Funciones de Clientes
  const addCliente = (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
    const nuevoCliente: Cliente = {
      ...cliente,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString(),
    };
    setClientes(prev => [...prev, nuevoCliente]);
  };

  const updateCliente = (id: string, updates: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  const getClienteById = (id: string) => clientes.find(c => c.id === id);
  const getClienteByRif = (rif: string) => clientes.find(c => c.rif === rif);

  // Funciones de Productos
  const addProducto = (producto: Omit<Producto, 'id'>) => {
    const nuevoProducto: Producto = {
      ...producto,
      id: crypto.randomUUID(),
    };
    setProductos(prev => [...prev, nuevoProducto]);
  };

  const updateProducto = (id: string, updates: Partial<Producto>) => {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProducto = (id: string) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const getProductoById = (id: string) => productos.find(p => p.id === id);
  const getProductoByCodigo = (codigo: string) => productos.find(p => p.codigo === codigo);

  // Generar código automático basado en el nombre del producto
  const generarCodigoProducto = (nombre: string): string => {
    // Obtener iniciales de cada palabra (máximo 4 palabras)
    const palabras = nombre.trim().toUpperCase().split(/\s+/).slice(0, 4);
    let iniciales = '';
    
    for (const palabra of palabras) {
      // Tomar la primera letra de cada palabra
      if (palabra.length > 0) {
        iniciales += palabra[0];
      }
      // Para palabras cortas (2-3 letras), tomar toda la palabra
      if (palabra.length >= 2 && palabra.length <= 3) {
        iniciales = palabra;
      }
    }
    
    // Si no hay iniciales, usar las primeras 3 letras del nombre
    if (iniciales.length < 2) {
      iniciales = nombre.trim().toUpperCase().substring(0, 3);
    }
    
    // Buscar el siguiente número disponible para este prefijo
    const prefijo = iniciales.substring(0, 4); // Máximo 4 caracteres
    const productosConMismoPrefijo = productos.filter(p => 
      p.codigo.toUpperCase().startsWith(prefijo)
    );
    
    let maxNumero = 0;
    for (const p of productosConMismoPrefijo) {
      const match = p.codigo.match(new RegExp(`^${prefijo}(-?)(\\d+)$`, 'i'));
      if (match) {
        const num = parseInt(match[2], 10);
        if (num > maxNumero) maxNumero = num;
      }
    }
    
    const siguienteNumero = (maxNumero + 1).toString().padStart(3, '0');
    return `${prefijo}-${siguienteNumero}`;
  };

  // Funciones de Facturas
  const getNextNumeroFactura = () => {
    const nextNum = configuracion.ultimoNumero + 1;
    return nextNum.toString().padStart(8, '0');
  };

  const addFactura = (factura: Omit<Factura, 'id' | 'numero' | 'numeroControl'>): Factura => {
    const nextNumero = getNextNumeroFactura();
    const numeroControl = `00-${nextNumero}`;
    
    const nuevaFactura: Factura = {
      ...factura,
      id: crypto.randomUUID(),
      numero: nextNumero,
      numeroControl,
    };
    
    setFacturas(prev => [...prev, nuevaFactura]);
    setConfiguracion(prev => ({ ...prev, ultimoNumero: prev.ultimoNumero + 1 }));
    
    return nuevaFactura;
  };

  const updateFactura = (id: string, updates: Partial<Factura>) => {
    setFacturas(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFactura = (id: string) => {
    setFacturas(prev => prev.filter(f => f.id !== id));
  };

  const getFacturaById = (id: string) => facturas.find(f => f.id === id);

  // Configuración
  const updateConfiguracion = (updates: Partial<Configuracion>) => {
    setConfiguracion(prev => ({ ...prev, ...updates }));
  };

  // Resumen Dashboard
  const getResumenDashboard = (): ResumenDashboard => {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const facturasMes = facturas.filter(f => {
      const fechaFactura = new Date(f.fecha);
      return fechaFactura >= inicioMes && f.tipo === 'factura';
    });
    
    const montoFacturado = facturasMes.reduce((sum, f) => sum + f.total, 0);
    
    return {
      totalFacturasMes: facturasMes.length,
      montoFacturadoMes: montoFacturado,
      totalClientes: clientes.length,
      totalProductos: productos.filter(p => p.activo).length,
      facturasPendientes: facturas.filter(f => f.estado === 'pendiente').length,
    };
  };

  // Libro de ventas
  const getLibroVentas = (fechaInicio: string, fechaFin: string) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    return facturas.filter(f => {
      const fecha = new Date(f.fecha);
      return fecha >= inicio && fecha <= fin && f.tipo === 'factura';
    }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  };

  // ========== FUNCIONES DE MATERIAS PRIMAS ==========
  const addMateriaPrima = (mp: Omit<MateriaPrima, 'id'>) => {
    const nuevaMP: MateriaPrima = {
      ...mp,
      id: crypto.randomUUID(),
    };
    setMateriasPrimas(prev => [...prev, nuevaMP]);
  };

  const updateMateriaPrima = (id: string, updates: Partial<MateriaPrima>) => {
    setMateriasPrimas(prev => prev.map(mp => mp.id === id ? { ...mp, ...updates } : mp));
  };

  const deleteMateriaPrima = (id: string) => {
    setMateriasPrimas(prev => prev.filter(mp => mp.id !== id));
  };

  const getMateriaPrimaById = (id: string) => materiasPrimas.find(mp => mp.id === id);

  // ========== FUNCIONES DE FÓRMULAS ==========
  const addFormula = (formula: Omit<Formula, 'id' | 'fechaCreacion'>) => {
    const nuevaFormula: Formula = {
      ...formula,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString(),
    };
    setFormulas(prev => [...prev, nuevaFormula]);
  };

  const updateFormula = (id: string, updates: Partial<Formula>) => {
    setFormulas(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFormula = (id: string) => {
    setFormulas(prev => prev.filter(f => f.id !== id));
  };

  const getFormulaById = (id: string) => formulas.find(f => f.id === id);

  const calcularCostoFormula = (ingredientes: Formula['ingredientes']): number => {
    return ingredientes.reduce((total, ing) => total + (ing.costo || 0), 0);
  };

  // ========== FUNCIONES DE LOTES ==========
  const addLote = (lote: Omit<LoteProduccion, 'id'>) => {
    const nuevoLote: LoteProduccion = {
      ...lote,
      id: crypto.randomUUID(),
    };
    setLotes(prev => [...prev, nuevoLote]);
  };

  const updateLote = (id: string, updates: Partial<LoteProduccion>) => {
    setLotes(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLote = (id: string) => {
    setLotes(prev => prev.filter(l => l.id !== id));
  };

  const getLotesByProducto = (productoId: string) => {
    return lotes.filter(l => l.productoId === productoId);
  };

  const getLotesProximosVencer = (dias: number) => {
    const hoy = new Date();
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(hoy.getDate() + dias);
    
    return lotes.filter(l => {
      const fechaVenc = new Date(l.fechaVencimiento);
      return fechaVenc <= fechaLimite && l.estado !== 'dispersado';
    });
  };

  // ========== FUNCIONES DE PAGOS ==========
  const getPagosByFactura = (facturaId: string) => {
    return pagos.filter(p => p.facturaId === facturaId);
  };

  const getTotalPagado = (facturaId: string) => {
    return pagos
      .filter(p => p.facturaId === facturaId)
      .reduce((sum, p) => sum + p.monto, 0);
  };

  const getSaldoPendiente = (facturaId: string) => {
    const factura = facturas.find(f => f.id === facturaId);
    if (!factura) return 0;
    return factura.total - getTotalPagado(facturaId);
  };

  const addPago = (pago: Omit<Pago, 'id'>) => {
    const nuevoPago: Pago = {
      ...pago,
      id: crypto.randomUUID(),
    };
    setPagos(prev => [...prev, nuevoPago]);
    
    // Actualizar estado de la factura si se pagó completamente
    const factura = facturas.find(f => f.id === pago.facturaId);
    if (factura) {
      const totalPagadoActual = getTotalPagado(pago.facturaId) + pago.monto;
      if (totalPagadoActual >= factura.total) {
        updateFactura(pago.facturaId, { estado: 'pagada' });
      }
    }
  };

  const deletePago = (id: string) => {
    setPagos(prev => prev.filter(p => p.id !== id));
  };

  // ========== FUNCIONES DE ENVÍOS ==========
  const addEnvio = (envio: Omit<Envio, 'id'>) => {
    const nuevoEnvio: Envio = {
      ...envio,
      id: crypto.randomUUID(),
    };
    setEnvios(prev => [...prev, nuevoEnvio]);
  };

  const updateEnvio = (id: string, updates: Partial<Envio>) => {
    setEnvios(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEnvio = (id: string) => {
    setEnvios(prev => prev.filter(e => e.id !== id));
  };

  const getEnvioByFactura = (facturaId: string) => {
    return envios.find(e => e.facturaId === facturaId);
  };

  const getEnviosByEstado = (estado: Envio['estado']) => {
    return envios.filter(e => e.estado === estado);
  };

  const getEnviosPendientes = () => {
    return envios.filter(e => ['pendiente', 'preparando', 'en-camino'].includes(e.estado));
  };

  const value: AppContextType = {
    empresa,
    clientes,
    productos,
    facturas,
    materiasPrimas,
    formulas,
    lotes,
    pagos,
    envios,
    configuracion,
    setEmpresa,
    updateEmpresa,
    addCliente,
    updateCliente,
    deleteCliente,
    getClienteById,
    getClienteByRif,
    addProducto,
    updateProducto,
    deleteProducto,
    getProductoById,
    getProductoByCodigo,
    generarCodigoProducto,
    addFactura,
    updateFactura,
    deleteFactura,
    getFacturaById,
    getNextNumeroFactura,
    addMateriaPrima,
    updateMateriaPrima,
    deleteMateriaPrima,
    getMateriaPrimaById,
    addFormula,
    updateFormula,
    deleteFormula,
    getFormulaById,
    calcularCostoFormula,
    addLote,
    updateLote,
    deleteLote,
    getLotesByProducto,
    getLotesProximosVencer,
    addPago,
    deletePago,
    getPagosByFactura,
    getTotalPagado,
    getSaldoPendiente,
    addEnvio,
    updateEnvio,
    deleteEnvio,
    getEnvioByFactura,
    getEnviosByEstado,
    getEnviosPendientes,
    updateConfiguracion,
    getResumenDashboard,
    getLibroVentas,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
}
