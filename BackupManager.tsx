import { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  FileJson,
  Calendar,
  HardDrive,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

interface BackupData {
  version: string;
  fechaExportacion: string;
  empresa: string;
  datos: {
    empresa: unknown;
    clientes: unknown[];
    productos: unknown[];
    facturas: unknown[];
    materiasPrimas: unknown[];
    formulas: unknown[];
    lotes: unknown[];
    pagos: unknown[];
    envios: unknown[];
    configuracion: unknown;
  };
}

export function BackupManager() {
  const { 
    empresa, 
    clientes, 
    productos, 
    facturas, 
    materiasPrimas, 
    formulas, 
    lotes, 
    pagos, 
    envios, 
    configuracion 
  } = useApp();
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcular estadísticas
  const totalRegistros = 
    clientes.length + 
    productos.length + 
    facturas.length + 
    materiasPrimas.length + 
    formulas.length + 
    lotes.length + 
    pagos.length + 
    envios.length;

  const ultimoBackup = localStorage.getItem('seniat_ultimo_backup');

  const handleExport = () => {
    const backupData: BackupData = {
      version: '1.0',
      fechaExportacion: new Date().toISOString(),
      empresa: empresa?.razonSocial || 'Sin nombre',
      datos: {
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
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fecha = new Date().toISOString().split('T')[0];
    const nombreEmpresa = (empresa?.razonSocial || 'backup').replace(/[^a-zA-Z0-9]/g, '_');
    
    link.href = url;
    link.download = `backup_${nombreEmpresa}_${fecha}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Guardar fecha del último backup
    localStorage.setItem('seniat_ultimo_backup', new Date().toISOString());
    
    toast.success('Backup exportado correctamente', {
      description: `Archivo: backup_${nombreEmpresa}_${fecha}.json`,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as BackupData;
        
        // Validar estructura
        if (!data.version || !data.datos) {
          toast.error('El archivo no tiene el formato correcto');
          return;
        }

        setImportPreview(data);
        setShowImportDialog(true);
      } catch (error) {
        toast.error('Error al leer el archivo', {
          description: 'Asegúrate de que sea un archivo JSON válido',
        });
      }
    };
    reader.readAsText(file);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!importPreview) return;

    try {
      const { datos } = importPreview;

      // Guardar cada colección en localStorage
      if (datos.empresa) localStorage.setItem('seniat_empresa', JSON.stringify(datos.empresa));
      if (datos.clientes) localStorage.setItem('seniat_clientes', JSON.stringify(datos.clientes));
      if (datos.productos) localStorage.setItem('seniat_productos', JSON.stringify(datos.productos));
      if (datos.facturas) localStorage.setItem('seniat_facturas', JSON.stringify(datos.facturas));
      if (datos.materiasPrimas) localStorage.setItem('seniat_materiasprimas', JSON.stringify(datos.materiasPrimas));
      if (datos.formulas) localStorage.setItem('seniat_formulas', JSON.stringify(datos.formulas));
      if (datos.lotes) localStorage.setItem('seniat_lotes', JSON.stringify(datos.lotes));
      if (datos.pagos) localStorage.setItem('seniat_pagos', JSON.stringify(datos.pagos));
      if (datos.envios) localStorage.setItem('seniat_envios', JSON.stringify(datos.envios));
      if (datos.configuracion) localStorage.setItem('seniat_config', JSON.stringify(datos.configuracion));

      toast.success('Datos importados correctamente', {
        description: 'La página se recargará para aplicar los cambios',
      });

      setShowImportDialog(false);
      
      // Recargar página después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('Error al importar los datos');
    }
  };

  const handleReset = () => {
    const keys = [
      'seniat_empresa',
      'seniat_clientes',
      'seniat_productos',
      'seniat_facturas',
      'seniat_materiasprimas',
      'seniat_formulas',
      'seniat_lotes',
      'seniat_pagos',
      'seniat_envios',
      'seniat_config',
      'seniat_pruebas_calidad',
      'seniat_ultimo_backup',
    ];

    keys.forEach(key => localStorage.removeItem(key));

    toast.success('Todos los datos han sido eliminados', {
      description: 'La página se recargará',
    });

    setShowResetDialog(false);
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-VE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Estado del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Estado de los Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{clientes.length}</p>
              <p className="text-sm text-slate-600">Clientes</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{productos.length}</p>
              <p className="text-sm text-slate-600">Productos</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{facturas.length}</p>
              <p className="text-sm text-slate-600">Facturas</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-600">{totalRegistros}</p>
              <p className="text-sm text-slate-600">Total Registros</p>
            </div>
          </div>
          
          {ultimoBackup && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>Último backup: {formatFecha(ultimoBackup)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones de Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exportar */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Download className="h-5 w-5" />
              Exportar Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Descarga todos tus datos en un archivo JSON. Guárdalo en tu computadora 
              como respaldo o para transferir a otro dispositivo.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileJson className="h-4 w-4" />
              <span>Formato: JSON</span>
            </div>
            <Button onClick={handleExport} className="w-full bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              Descargar Backup
            </Button>
          </CardContent>
        </Card>

        {/* Importar */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Upload className="h-5 w-5" />
              Importar Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Restaura tus datos desde un archivo de backup previamente exportado. 
              Esto reemplazará todos los datos actuales.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <HardDrive className="h-4 w-4" />
              <span>Tamaño máximo: 50MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Archivo
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Zona de peligro */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            <strong>Advertencia:</strong> Estas acciones son irreversibles. 
            Asegúrate de haber exportado tus datos antes de continuar.
          </p>
          <Button 
            onClick={() => setShowResetDialog(true)} 
            variant="outline" 
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Todos los Datos
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de confirmación de importación */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Confirmar Importación
            </DialogTitle>
            <DialogDescription>
              Esto reemplazará todos los datos actuales. Asegúrate de haber exportado 
              un backup primero.
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Empresa:</span>
                <span className="font-medium">{importPreview.empresa}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Fecha del backup:</span>
                <span className="font-medium">{formatFecha(importPreview.fechaExportacion)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Versión:</span>
                <Badge variant="secondary">{importPreview.version}</Badge>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium text-slate-700 mb-2">Datos a importar:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Clientes:</span>
                    <span className="font-medium">{importPreview.datos.clientes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Productos:</span>
                    <span className="font-medium">{importPreview.datos.productos?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Facturas:</span>
                    <span className="font-medium">{importPreview.datos.facturas?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Envíos:</span>
                    <span className="font-medium">{importPreview.datos.envios?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar Importación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de reset */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              ¿Eliminar todos los datos?
            </DialogTitle>
            <DialogDescription>
              Esta acción es <strong>irreversible</strong>. Todos tus clientes, productos, 
              facturas y configuraciones serán eliminados permanentemente.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              <strong>Recomendación:</strong> Exporta un backup antes de continuar.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReset} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Sí, Eliminar Todo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
