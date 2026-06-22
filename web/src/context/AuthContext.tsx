import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  nombre: string;
  rol: 'ADMIN' | 'EJECUTIVO' | 'OPERARIO';
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, rol: string, nombre: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) setUser(JSON.parse(stored));
    setInitialized(true);
  }, []);

  const login = (token: string, rol: string, nombre: string) => {
    const u: AuthUser = { token, rol: rol as AuthUser['rol'], nombre };
    setUser(u);
    localStorage.setItem('auth', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
