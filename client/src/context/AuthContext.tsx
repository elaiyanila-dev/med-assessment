import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";
import type {
  ApiResponse,
  AuthenticatedUser,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse
} from "../../../shared/types";

export type UserProfile = AuthenticatedUser;

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "mednxt_auth_token";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (currentToken: string) => {
    try {
      const response = await api.get<ApiResponse<CurrentUserResponse>>("/auth/me");
      if (response.data?.success && response.data?.data?.user) {
        setUser(response.data.data.user);
        setToken(currentToken);
      } else {
        throw new Error("Invalid profile response");
      }
    } catch (error) {
      // Clear token if invalid or fetch failed
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const existingToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (existingToken) {
      fetchCurrentUser(existingToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const payload: LoginRequest = { email, password };
      const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", payload);
      if (response.data?.success && response.data?.data) {
        const { token: newToken, user: userData } = response.data.data;
        localStorage.setItem(AUTH_TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(userData);
      } else {
        throw new Error(response.data?.error?.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    // Optionally fire logout API in background (fire-and-forget)
    api.post("/auth/logout").catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
