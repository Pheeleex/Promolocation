import React from "react";
import { createContext, useContext, useEffect } from "react";
import { isAccessTokenExpired, useAuthStore } from "../store/auth-store";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedAuthUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const login = useAuthStore((state) => state.setAuth);
  const logoutFromStore = useAuthStore((state) => state.logout);
  const authUser =
    storedAuthUser && accessToken && !isAccessTokenExpired(expiresAt)
      ? storedAuthUser
      : null;

  const logout = () => {
    logoutFromStore();

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authUser");
      window.localStorage.removeItem("auth-storage");
    }
  };

  useEffect(() => {
    if (!storedAuthUser) {
      return;
    }

    if (!accessToken || isAccessTokenExpired(expiresAt)) {
      logout();
    }
  }, [accessToken, expiresAt, storedAuthUser]);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
