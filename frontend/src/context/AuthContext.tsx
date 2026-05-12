import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type RegisterInput, type LoginInput } from '@/services/auth.service';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al iniciar, restaura la sesión si hay un token guardado
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    authService
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (input: LoginInput) => {
    const result = await authService.login(input);
    localStorage.setItem('accessToken', result.accessToken);
    setUser(result.user);
  };

  const register = async (input: RegisterInput) => {
    const result = await authService.register(input);
    localStorage.setItem('accessToken', result.accessToken);
    setUser(result.user);
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
