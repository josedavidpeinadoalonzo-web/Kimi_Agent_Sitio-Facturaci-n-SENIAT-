import { useState, useEffect, useRef } from 'react';
import { Building2, Save, AlertCircle, Upload, Image, X, Wallet, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { BackupManager } from '@/components/BackupManager';

export function Configuracion() {
  const { empresa, updateEmpresa, configuracion, updateConfiguracion } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    razonSocial: '',
    rif: '',
    direccion: '',
    telefono: '',
    email: '',
    imprentaNombre: '',
    imprentaAutorizacion: '',
    ivaGeneral: 16,
    prefijoFactura: 'FAC',
    // Datos de pago
    pmBanco: '',
    pmTelefono: '',
    pmDocumento: '',
    transBanco: '',
    transCuenta: '',
    transTitular: '',
    transTipo: 'ahorro' as 'ahorro' | 'corriente',
    zelleEmail: '',
    zelleTitular: '',
    binanceId: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (empresa) {
      setFormData({
        razonSocial: empresa.razonSocial,
        rif: empresa.rif,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        email: empresa.email,
        imprentaNombre: empresa.imprentaDigital.nombre,
        imprentaAutorizacion: empresa.imprentaDigital.autorizacion,
        ivaGeneral: configuracion.ivaGeneral,
        prefijoFactura: configuracion.prefijoFactura,
        // Datos de pago
        pmBanco: configuracion.datosPagoMovil?.banco || '',
        pmTelefono: configuracion.datosPagoMovil?.telefono || '',
        pmDocumento: configuracion.datosPagoMovil?.documento || '',
        transBanco: configuracion.datosTransferencia?.banco || '',
        transCuenta: configuracion.datosTransferencia?.cuenta || '',
        transTitular: configuracion.datosTransferencia?.titular || '',
        transTipo: configuracion.datosTransferencia?.tipo || 'ahorro',
        zelleEmail: configuracion.datosZelle?.email || '',
        zelleTitular: configuracion.datosZelle?.titular || '',
        binanceId: configuracion.datosBinance?.id || '',
      });
      if (empresa.logo) {
        setLogoPreview(empresa.logo);
      }
    }
  }, [empresa, configuracion]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      toast.success('Logo cargado correctamente');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!empresa) return;

    // Validar RIF
    const rifRegex = /^[VJEGP]-\d{8}-\d$/;
    if (!rifRegex.test(formData.rif)) {
      toast.error('El RIF debe tener el formato J-12345678-9');
      return;
    }

    // Actualizar empresa
    updateEmpresa({
      razonSocial: formData.razonSocial,
      rif: formData.rif,
      direccion: formData.direccion,
      telefono: formData.telefono,
      email: formData.email,
      logo: logoPreview || undefined,
      imprentaDigital: {
        nombre: formData.imprentaNombre,
        autorizacion: formData.imprentaAutorizacion,
      },
    });

    // Actualizar configuración
    updateConfiguracion({
      ivaGeneral: Number(formData.ivaGeneral),
      prefijoFactura: formData.prefijoFactura,
      // Datos de pago
      datosPagoMovil: formData.pmBanco ? {
        banco: formData.pmBanco,
        telefono: formData.pmTelefono,
        documento: formData.pmDocumento,
      } : undefined,
      datosTransferencia: formData.transBanco ? {
        banco: formData.transBanco,
        cuenta: formData.transCuenta,
        titular: formData.transTitular,
        tipo: formData.transTipo,
      } : undefined,
      datosZelle: formData.zelleEmail ? {
        email: formData.zelleEmail,
        titular: formData.zelleTitular,
      } : undefined,
      datosBinance: formData.binanceId ? {
        id: formData.binanceId,
      } : undefined,
    });

    toast.success('Configuración guardada correctamente');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
          <p className="text-slate-500">Datos fiscales de la empresa y parámetros del sistema</p>
        </div>
      </div>

      {/* Alerta informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Configuración de Imprenta Digital</h4>
            <p className="text-sm text-blue-700 mt-1">
              Los datos de la imprenta digital son obligatorios según la Providencia SNAT/2024/000102.
              Debe contratar los servicios de una imprenta digital autorizada por el SENIAT.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Datos de la Empresa */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <CardTitle>Datos de la Empresa (Emisor)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razonSocial">
                  Razón Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="razonSocial"
                  value={formData.razonSocial}
                  onChange={e => handleChange('razonSocial', e.target.value)}
                  placeholder="Nombre completo de la empresa"
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
                  onChange={e => handleChange('rif', e.target.value)}
                  placeholder="J-12345678-9"
                  required
                />
                <p className="text-xs text-slate-500">Formato: J-12345678-9, V-12345678-9, G-12345678-9</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">
                  Domicilio Fiscal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={e => handleChange('direccion', e.target.value)}
                  placeholder="Dirección completa"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={e => handleChange('telefono', e.target.value)}
                    placeholder="(0212) 555-1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="facturacion@empresa.com"
                  />
                </div>
              </div>

              {/* Logo de la Empresa */}
              <div className="space-y-2">
                <Label>Logo de la Empresa</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-20 w-20 object-contain border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                      <Image className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                    </Button>
                    <p className="text-xs text-slate-500 mt-1">
                      Máximo 2MB. Formatos: JPG, PNG, SVG
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos de Imprenta Digital y Configuración */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imprenta Digital Autorizada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imprentaNombre">
                    Nombre de la Imprenta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="imprentaNombre"
                    value={formData.imprentaNombre}
                    onChange={e => handleChange('imprentaNombre', e.target.value)}
                    placeholder="IMPRENTA DIGITAL SENIAT C.A."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imprentaAutorizacion">
                    Número de Autorización SENIAT <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="imprentaAutorizacion"
                    value={formData.imprentaAutorizacion}
                    onChange={e => handleChange('imprentaAutorizacion', e.target.value)}
                    placeholder="SENIAT-IMP-2024-001"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parámetros del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ivaGeneral">
                      IVA General (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ivaGeneral"
                      type="number"
                      min={0}
                      max={100}
                      value={formData.ivaGeneral}
                      onChange={e => handleChange('ivaGeneral', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prefijoFactura">
                      Prefijo Factura <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="prefijoFactura"
                      value={formData.prefijoFactura}
                      onChange={e => handleChange('prefijoFactura', e.target.value)}
                      placeholder="FAC"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos de Pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Tus Datos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pago Móvil */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-3">Pago Móvil</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Input
                        value={formData.pmBanco}
                        onChange={e => handleChange('pmBanco', e.target.value)}
                        placeholder="Banco de Venezuela"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={formData.pmTelefono}
                        onChange={e => handleChange('pmTelefono', e.target.value)}
                        placeholder="0414-1234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Documento (RIF/CI)</Label>
                      <Input
                        value={formData.pmDocumento}
                        onChange={e => handleChange('pmDocumento', e.target.value)}
                        placeholder="J-12345678-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Transferencia */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-3">Transferencia Bancaria</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Input
                        value={formData.transBanco}
                        onChange={e => handleChange('transBanco', e.target.value)}
                        placeholder="Banesco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Cuenta</Label>
                      <select
                        value={formData.transTipo}
                        onChange={e => handleChange('transTipo', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      >
                        <option value="ahorro">Ahorro</option>
                        <option value="corriente">Corriente</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número de Cuenta</Label>
                      <Input
                        value={formData.transCuenta}
                        onChange={e => handleChange('transCuenta', e.target.value)}
                        placeholder="0134-1234-5678-9012-3456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Titular</Label>
                      <Input
                        value={formData.transTitular}
                        onChange={e => handleChange('transTitular', e.target.value)}
                        placeholder="Nombre del titular"
                      />
                    </div>
                  </div>
                </div>

                {/* Zelle */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-3">Zelle</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.zelleEmail}
                        onChange={e => handleChange('zelleEmail', e.target.value)}
                        placeholder="tuemail@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Titular</Label>
                      <Input
                        value={formData.zelleTitular}
                        onChange={e => handleChange('zelleTitular', e.target.value)}
                        placeholder="Nombre en Zelle"
                      />
                    </div>
                  </div>
                </div>

                {/* Binance */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-3">Binance Pay</h4>
                  <div className="space-y-2">
                    <Label>ID de Binance Pay</Label>
                    <Input
                      value={formData.binanceId}
                      onChange={e => handleChange('binanceId', e.target.value)}
                      placeholder="Tu ID de Binance Pay"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Backup y Restauración */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Backup y Restauración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BackupManager />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg">
            <Save className="mr-2 h-4 w-4" />
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
