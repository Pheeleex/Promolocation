import React from "react";
import { createContext, useContext } from "react";
import { useAuthStore } from "../store/auth-store";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const authUser = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.setAuth);
  const logoutFromStore = useAuthStore((state) => state.logout);

  const logout = () => {
    logoutFromStore();

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authUser");
    }
  };

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
