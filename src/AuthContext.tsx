import React, { createContext, useState, useEffect, ReactNode } from 'react';
import Settings from './Settings';

type User = {
  email?: string;
  sub?: string;
} | null;

type AuthUrlResponse = {
  authUrl: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${Settings.API_URL}/google?type=auth-check`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.authenticated);
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${Settings.API_URL}/google?type=auth`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to get auth URL');
      const data: AuthUrlResponse = await res.json();
      window.location.href = data.authUrl;
    } catch (err: any) {
      setError(err.message);
      console.error("Authentication error:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${Settings.API_URL}/google?type=logout`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Logout failed');
      setIsAuthenticated(false);
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (err: any) {
      setError('Logout failed, please try again.');
      console.error("Error logging out:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      loading, 
      error, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
