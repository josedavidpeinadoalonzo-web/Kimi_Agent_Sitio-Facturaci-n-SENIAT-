import { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Send, 
  RefreshCw,
  FileText,
  Globe,
  Shield,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { db, enviarFacturaASeniat, consultarEstadoFacturaSeniat } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import type { Factura } from '@/types';

interface FacturaSeniat {
  id: string;
  facturaId: string;
  numeroFactura: string;
  numeroControl?: string;
  fechaEnvio: string;
  estado: 'pendiente' | 'procesando' | 'aprobada' | 'rechazada' | 'error';
  mensaje?: string;
  ambiente: 'pruebas' | 'produccion';
}

export function SeniatIntegration() {
  const { facturas, empresa } = useApp();
  const { isAdmin } = useAuth();
  const [ambiente, setAmbiente] = useState<'pruebas' | 'produccion'>('pruebas');
  const [facturasSeniat, setFacturasSeniat] = useState<FacturaSeniat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);

  // Cargar facturas enviadas a SENIAT
  useEffect(() => {
    if (!empresa?.id) return;

    const q = query(
      collection(db, 'empresas', empresa.id, 'seniat_envios')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const envios = snapshot.docs.map(doc => doc.data() as FacturaSeniat);
      setFacturasSeniat(envios);
    });

    return () => unsubscribe();
  }, [empresa?.id]);

  // Facturas pendientes de envío
  const facturasPendientes = facturas.filter(f => 
    f.tipo === 'factura' && 
    f.estado !== 'anulada' &&
    !facturasSeniat.some(fs => fs.facturaId === f.id)
  );

  const handleEnviarSeniat = async (factura: Factura) => {
    if (!empresa?.id) {
      toast.error('No hay empresa configurada');
      return;
    }

    setIsLoading(true);
    setSelectedFactura(factura);

    try {
      const resultado = await enviarFacturaASeniat(empresa.id, {
        id: factura.id,
        numero: factura.numero,
        cliente: factura.cliente,
        total: factura.total,
        fecha: factura.fecha,
        lineas: factura.lineas,
      });

      if (resultado.exito) {
        toast.success('Factura enviada a SENIAT', {
          description: `Número de control: ${resultado.numeroControl}`,
        });
      } else {
        toast.error('Error al enviar a SENIAT', {
          description: resultado.mensaje,
        });
      }
    } catch (error) {
      toast.error('Error de comunicación con SENIAT');
    } finally {
      setIsLoading(false);
      setSelectedFactura(null);
    }
  };

  const handleConsultarEstado = async (facturaSeniat: FacturaSeniat) => {
    if (!facturaSeniat.numeroControl) return;

    setIsLoading(true);
    try {
      const estado = await consultarEstadoFacturaSeniat(
        empresa?.id || '',
        facturaSeniat.numeroControl
      );

      toast.success(`Estado: ${estado.estado}`, {
        description: estado.mensaje,
      });
    } catch (error) {
      toast.error('Error al consultar estado');
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadge = (estado: FacturaSeniat['estado']) => {
    const estados = {
      pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
      procesando: { label: 'Procesando', color: 'bg-blue-100 text-blue-700' },
      aprobada: { label: 'Aprobada', color: 'bg-green-100 text-green-700' },
      rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
      error: { label: 'Error', color: 'bg-slate-100 text-slate-700' },
    };

    const config = estados[estado];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(monto);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Shield className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Acceso Restringido</h2>
        <p className="text-slate-500">Solo los administradores pueden gestionar la integración SENIAT</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Integración SENIAT</h1>
        <p className="text-slate-500">Envío de facturas electrónicas al SENIAT</p>
      </div>

      {/* Estado de la integración */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Estado de la Conexión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">API SENIAT - En desarrollo</p>
                <p className="text-sm text-slate-500">
                  La API oficial del SENIAT aún no está disponible públicamente
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700">
              Modo Simulación
            </Badge>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Información importante:</strong> Según la Providencia Administrativa 
                  SNAT/2024/000102, el SENIAT está desarrollando la plataforma de facturación 
                  electrónica. Actualmente el sistema opera en modo de simulación para pruebas.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={ambiente} onValueChange={(v) => setAmbiente(v as 'pruebas' | 'produccion')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pruebas">
                    <div className="flex items-center gap-2">
                      <span>🧪</span>
                      <span>Pruebas (Sandbox)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="produccion">
                    <div className="flex items-center gap-2">
                      <span>🚀</span>
                      <span>Producción</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {ambiente === 'pruebas' 
                  ? 'Las facturas se envían al ambiente de pruebas sin validez fiscal'
                  : 'Las facturas tendrán validez fiscal ante el SENIAT'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label>Empresa Registrada</Label>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium">{empresa?.razonSocial || 'No configurada'}</p>
                    <p className="text-sm text-slate-500">{empresa?.rif || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facturas pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Facturas Pendientes de Envío ({facturasPendientes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facturasPendientes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>Todas las facturas han sido enviadas a SENIAT</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">N° Factura</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Cliente</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasPendientes.slice(0, 5).map((factura) => (
                    <tr key={factura.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono">{factura.numero}</td>
                      <td className="py-3 px-4">{factura.cliente.razonSocial}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatMonto(factura.total)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleEnviarSeniat(factura)}
                          disabled={isLoading && selectedFactura?.id === factura.id}
                        >
                          {isLoading && selectedFactura?.id === factura.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Enviar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {facturasPendientes.length > 5 && (
                <p className="text-center text-sm text-slate-500 mt-4">
                  Y {facturasPendientes.length - 5} facturas más...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de envíos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Envíos ({facturasSeniat.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facturasSeniat.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
              <p>No hay facturas enviadas a SENIAT</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">N° Control</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Ambiente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Fecha Envío</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasSeniat
                    .sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime())
                    .slice(0, 10)
                    .map((envio) => (
                    <tr key={envio.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-sm">
                        {envio.numeroControl || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getEstadoBadge(envio.estado)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {envio.ambiente === 'pruebas' ? '🧪 Pruebas' : '🚀 Producción'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(envio.fechaEnvio).toLocaleString('es-VE')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConsultarEstado(envio)}
                          disabled={isLoading || !envio.numeroControl}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Consultar
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

      {/* Información legal */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-800">Aviso Legal</h4>
            <p className="text-sm text-amber-700 mt-1">
              Este sistema está preparado para la integración con el SENIAT según la 
              Providencia Administrativa SNAT/2024/000102. Sin embargo, la API oficial 
              del SENIAT para facturación electrónica aún no está disponible públicamente.
              Las facturas generadas actualmente tienen validez comercial pero no fiscal 
              hasta que se complete la integración oficial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
