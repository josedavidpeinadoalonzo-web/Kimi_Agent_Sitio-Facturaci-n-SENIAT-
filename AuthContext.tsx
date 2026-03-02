import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  auth, 
  db,
  loginUser, 
  logoutUser, 
  registerUser,
  type UserData,
  type UserRole,
  tienePermiso,
  onAuthStateChanged,
  type FirebaseUser
} from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

interface AuthContextType {
  // Usuario actual
  user: FirebaseUser | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, nombre: string, apellido: string, rol?: UserRole) => Promise<void>;
  
  // Permisos
  can: (permiso: string) => boolean;
  isAdmin: boolean;
  isVendedor: boolean;
  isProduccion: boolean;
  isContador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Escuchar datos del usuario en tiempo real
        const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data() as UserData);
          }
        });
        
        return () => unsubscribeUser();
      } else {
        setUserData(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await loginUser(email, password);
      toast.success('Sesión iniciada correctamente');
    } catch (error: any) {
      console.error('Error de login:', error);
      
      let mensaje = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found') {
        mensaje = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        mensaje = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        mensaje = 'Demasiados intentos. Intenta más tarde';
      }
      
      toast.error(mensaje);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      toast.success('Sesión cerrada');
    } catch (error) {
      toast.error('Error al cerrar sesión');
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    nombre: string, 
    apellido: string,
    rol: UserRole = 'vendedor'
  ) => {
    try {
      setIsLoading(true);
      await registerUser(email, password, nombre, apellido, rol);
      toast.success('Usuario registrado correctamente');
    } catch (error: any) {
      console.error('Error de registro:', error);
      
      let mensaje = 'Error al registrar usuario';
      if (error.code === 'auth/email-already-in-use') {
        mensaje = 'Este email ya está registrado';
      } else if (error.code === 'auth/weak-password') {
        mensaje = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'Email inválido';
      }
      
      toast.error(mensaje);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const can = (permiso: string): boolean => {
    if (!userData) return false;
    return tienePermiso(userData.rol, permiso);
  };

  const value: AuthContextType = {
    user,
    userData,
    isAuthenticated: !!user && !!userData?.activo,
    isLoading,
    login,
    logout,
    register,
    can,
    isAdmin: userData?.rol === 'admin',
    isVendedor: userData?.rol === 'vendedor',
    isProduccion: userData?.rol === 'produccion',
    isContador: userData?.rol === 'contador',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
