// Firebase Configuration - FacturaDigital VE
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query,
  onSnapshot,
  type DocumentData,
  writeBatch,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase (esto se reemplazará con tus credenciales)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Habilitar persistencia offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Persistencia fallida: múltiples pestañas abiertas');
  } else if (err.code === 'unimplemented') {
    console.log('Persistencia no soportada en este navegador');
  }
});

// ==================== TIPOS ====================
export type UserRole = 'admin' | 'vendedor' | 'produccion' | 'contador';

export interface UserData {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  telefono?: string;
  activo: boolean;
  fechaRegistro: string;
  ultimoAcceso?: string;
  empresaId: string;
}

export interface EmpresaData {
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
  plan: 'gratuito' | 'basico' | 'profesional';
  fechaRegistro: string;
  seniatConfig?: {
    apiKey?: string;
    ambiente: 'pruebas' | 'produccion';
    ultimaSincronizacion?: string;
  };
}

// ==================== AUTENTICACIÓN ====================

export const registerUser = async (
  email: string, 
  password: string, 
  nombre: string, 
  apellido: string,
  rol: UserRole = 'vendedor',
  empresaId: string = 'default'
): Promise<UserData> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await updateProfile(user, {
    displayName: `${nombre} ${apellido}`
  });

  const userData: UserData = {
    uid: user.uid,
    email: user.email!,
    nombre,
    apellido,
    rol,
    activo: true,
    fechaRegistro: new Date().toISOString(),
    empresaId
  };

  await setDoc(doc(db, 'usuarios', user.uid), userData);
  return userData;
};

export const loginUser = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Actualizar último acceso
  await updateDoc(doc(db, 'usuarios', userCredential.user.uid), {
    ultimoAcceso: new Date().toISOString()
  });
  
  return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUserData = async (uid: string): Promise<UserData | null> => {
  const docRef = doc(db, 'usuarios', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserData;
  }
  return null;
};

export const updateUserRole = async (uid: string, rol: UserRole): Promise<void> => {
  await updateDoc(doc(db, 'usuarios', uid), { rol });
};

export const deactivateUser = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'usuarios', uid), { activo: false });
};

// ==================== EMPRESA ====================

export const createEmpresa = async (empresaData: Omit<EmpresaData, 'id'>): Promise<string> => {
  const docRef = doc(collection(db, 'empresas'));
  await setDoc(docRef, { ...empresaData, id: docRef.id });
  return docRef.id;
};

export const getEmpresa = async (empresaId: string): Promise<EmpresaData | null> => {
  const docRef = doc(db, 'empresas', empresaId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as EmpresaData;
  }
  return null;
};

export const updateEmpresa = async (empresaId: string, data: Partial<EmpresaData>): Promise<void> => {
  await updateDoc(doc(db, 'empresas', empresaId), data);
};

// ==================== SINCRONIZACIÓN DE DATOS ====================

// Sincronizar datos locales con Firebase
export const syncToFirebase = async (empresaId: string, data: {
  clientes?: DocumentData[];
  productos?: DocumentData[];
  facturas?: DocumentData[];
  materiasPrimas?: DocumentData[];
  formulas?: DocumentData[];
  lotes?: DocumentData[];
  pagos?: DocumentData[];
  envios?: DocumentData[];
  configuracion?: DocumentData;
}): Promise<void> => {
  const batch = writeBatch(db);
  
  // Sincronizar cada colección
  Object.entries(data).forEach(([coleccion, items]) => {
    if (items && Array.isArray(items)) {
      items.forEach((item) => {
        const docRef = doc(db, 'empresas', empresaId, coleccion, item.id || crypto.randomUUID());
        batch.set(docRef, { ...item, ultimaActualizacion: new Date().toISOString() });
      });
    }
  });

  await batch.commit();
};

// Escuchar cambios en tiempo real
export const subscribeToCollection = (
  empresaId: string,
  coleccion: string,
  callback: (data: DocumentData[]) => void
) => {
  const q = query(collection(db, 'empresas', empresaId, coleccion));
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// ==================== PERMISOS POR ROL ====================

export const PERMISOS: Record<UserRole, string[]> = {
  admin: [
    'dashboard',
    'configuracion',
    'clientes',
    'productos',
    'materiasPrimas',
    'formulas',
    'lotes',
    'controlCalidad',
    'facturas',
    'pagos',
    'envios',
    'notas',
    'reportes',
    'catalogoWhatsapp',
    'usuarios', // Solo admin puede gestionar usuarios
    'seniat'
  ],
  vendedor: [
    'dashboard',
    'clientes',
    'productos',
    'facturas',
    'pagos',
    'envios',
    'catalogoWhatsapp'
  ],
  produccion: [
    'dashboard',
    'materiasPrimas',
    'formulas',
    'lotes',
    'controlCalidad',
    'productos'
  ],
  contador: [
    'dashboard',
    'facturas',
    'pagos',
    'notas',
    'reportes'
  ]
};

export const tienePermiso = (rol: UserRole, permiso: string): boolean => {
  return PERMISOS[rol]?.includes(permiso) || false;
};

// ==================== SENIAT INTEGRACIÓN ====================

export interface SeniatConfig {
  ambiente: 'pruebas' | 'produccion';
  apiUrl: string;
  certificado?: string;
  token?: string;
}

// Simulación de envío a SENIAT (cuando la API esté disponible)
export const enviarFacturaASeniat = async (
  empresaId: string,
  facturaData: DocumentData
): Promise<{ exito: boolean; mensaje: string; numeroControl?: string }> => {
  try {
    const empresa = await getEmpresa(empresaId);
    
    if (!empresa?.seniatConfig?.apiKey) {
      return {
        exito: false,
        mensaje: 'La empresa no tiene configurada la integración con SENIAT'
      };
    }

    // Aquí iría la llamada real a la API de SENIAT
    // Por ahora simulamos el envío
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generar número de control simulado
    const numeroControl = `00-${Date.now().toString().slice(-8)}`;
    
    // Guardar respuesta en Firebase
    await setDoc(doc(db, 'empresas', empresaId, 'seniat_envios', facturaData.id), {
      facturaId: facturaData.id,
      numeroControl,
      fechaEnvio: new Date().toISOString(),
      estado: 'procesando',
      ambiente: empresa.seniatConfig.ambiente
    });

    return {
      exito: true,
      mensaje: 'Factura enviada a SENIAT correctamente',
      numeroControl
    };
  } catch (error) {
    console.error('Error enviando a SENIAT:', error);
    return {
      exito: false,
      mensaje: 'Error al comunicarse con SENIAT'
    };
  }
};

// Consultar estado de factura en SENIAT
export const consultarEstadoFacturaSeniat = async (
  _empresaId: string,
  _numeroControl: string
): Promise<{ estado: string; mensaje: string }> => {
  // Simulación - en producción llamaría a la API real
  return {
    estado: 'aprobada',
    mensaje: 'Factura aprobada por SENIAT'
  };
};

export { onAuthStateChanged };
export type { FirebaseUser };
