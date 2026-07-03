import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../../api/auth/authApi';
import type { MeResponse } from '../../types/auth';

type AuthContextValue = {
  user: MeResponse | null;
  isRestoring: boolean;
  login: (loginId: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsRestoring(false));
  }, []);

  const login = async (loginId: string, password: string, rememberMe: boolean = false) => {
    await authApi.login(loginId, password, rememberMe);
    const me = await authApi.fetchMe();
    setUser(me);
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  };

  const refreshMe = async () => {
    const me = await authApi.fetchMe();
    setUser(me);
  };

  return (
    <AuthContext.Provider value={{ user, isRestoring, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
