import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authApi, tokenStorage, UserData } from '../lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AuthState {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setUser = (user: UserData | null) => {
    setState({ user, isLoading: false, isAuthenticated: !!user });
  };

  // On mount, try to restore session
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => {
        tokenStorage.clear();
        setState({ user: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    tokenStorage.setAccess(res.accessToken);
    tokenStorage.setRefresh(res.refreshToken);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role?: string;
    }) => {
      const res = await authApi.register(data);
      tokenStorage.setAccess(res.accessToken);
      tokenStorage.setRefresh(res.refreshToken);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue even if logout request fails
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.getMe();
      setUser(user);
    } catch {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
