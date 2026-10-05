'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '@impactlens/shared';
import { api, getAuthToken, setAuthToken, removeAuthToken } from './api-client';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: 'analyst' | 'reviewer' | 'manager' | 'admin' | 'viewer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const userData = await api.get<AuthUser>('/auth/me');
      setUser(userData);
    } catch {
      removeAuthToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const existingToken = getAuthToken();
    if (existingToken) {
      setToken(existingToken);
      fetchCurrentUser();
    } else {
      // Auto-login as default Analyst for instant frictionless demo experience
      switchDemoUser('analyst');
    }
  }, []);

  const login = async (email: string, password: string = 'Password123!') => {
    setIsLoading(true);
    try {
      const res = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      });
      setAuthToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setToken(null);
  };

  const switchDemoUser = async (role: 'analyst' | 'reviewer' | 'manager' | 'admin' | 'viewer') => {
    const email = `${role}@impactlens.local`;
    await login(email, 'Password123!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
