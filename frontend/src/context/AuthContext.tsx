import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      // No session at all — just go to loading=false, let Layout redirect to login
      setLoading(false);
      return;
    }

    // We have a token — optimistically set user from cache so the page loads
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch {
      clearAuth();
      setLoading(false);
      return;
    }

    // Validate the token against the server
    api
      .get("/auth/me")
      .then((res) => {
        if (res.data?.data) {
          const fresh = res.data.data;
          setUser(fresh);
          localStorage.setItem("user", JSON.stringify(fresh));
        }
      })
      .catch(() => {
        // Token is stale / user not found (e.g. backend restarted) — clear and force re-login
        clearAuth();
      })
      .finally(() => setLoading(false));
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
