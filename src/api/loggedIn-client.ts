// src/api/authenticated-client.ts
import { apiClient } from "./client";
import { useAuthStore } from "../store/auth-store";

const API_TOKEN = import.meta.env.VITE_API_TOKEN;

export async function authenticatedPost<T>(
  url: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const jwt = useAuthStore.getState().accessToken;

  if (!jwt) {
    throw new Error("No access token found. Please log in again.");
  }

  return apiClient<T>(url, {
    method: "POST",
    body: JSON.stringify({
      token: API_TOKEN,
      jwt,
      ...body,
    }),
  });
}
