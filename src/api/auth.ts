// src/api/auth.ts
import { LoginPayload, LoginResponse } from "../../types/auth";
import { apiClient } from "./client";

export function login(payload: LoginPayload) {
  return apiClient<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
