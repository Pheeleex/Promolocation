import { create } from "zustand";
import { LoginResponse } from "../../types/auth";
import { persist } from "zustand/middleware";

type AuthUser = {
  user_id: number;
  promoter_id: string | null;
  email: string;
  fullname: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_role: string;
  avatar: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  expiresAt: number | null;
  active: boolean;
  setAuth: (data: LoginResponse) => void;
  logout: () => void;
};

export function isAccessTokenExpired(expiresAt?: number | null) {
  return typeof expiresAt === "number" && Date.now() >= expiresAt;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
      active: false,
      setAuth: (data: LoginResponse) =>
        set({
          user: {
            user_id: data.user_id,
            promoter_id: data.promoter_id ?? null,
            email: data.email,
            fullname: data.fullname,
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            user_role: data.user_role,
            avatar: data.avatar,
          },
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenType: data.token_type,
          expiresAt:
            typeof data.expires_in === "number" && Number.isFinite(data.expires_in)
              ? Date.now() + data.expires_in * 1000
              : null,
          active: data.active,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          expiresAt: null,
          active: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
