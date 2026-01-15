import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const login = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const refreshUser = useCallback(async (currentToken) => {
    const tokenToUse = currentToken || token || localStorage.getItem("token");
    if (!tokenToUse) return;

    try {
      const response = await api.get("/user", {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to refresh user data", error);
      // Optional: if 401, maybe logout? But allow soft fail for now 
      // to avoid logout loops on network errors.
      if (error.response && error.response.status === 401) {
        logout();
      }
    }
  }, [token, logout]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken) {
        setToken(storedToken);
        // Optimistically set stored user first
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // ignore parse error
          }
        }
        // Then fetch fresh data
        await refreshUser(storedToken);
      }
      setIsBootstrapping(false);
    };

    initAuth();
  }, [refreshUser]);

  const value = {
    user,
    token,
    isBootstrapping,
    login,
    logout,
    refreshUser // Expose if needed manually
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};


