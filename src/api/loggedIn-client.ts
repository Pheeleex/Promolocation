// src/api/authenticated-client.ts
import { ApiError } from "../../types/auth";
import { apiClient } from "./client";
import { isAccessTokenExpired, useAuthStore } from "../store/auth-store";

const API_TOKEN = import.meta.env.VITE_API_TOKEN ?? "";

function clearAuthSession() {
  useAuthStore.getState().logout();

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("authUser");
    window.localStorage.removeItem("auth-storage");
  }
}

function getLogicalStatus(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("status" in payload)) {
    return null;
  }

  const status = (payload as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

function getLogicalMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return null;
  }

  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

async function runAuthenticatedRequest<T>(request: () => Promise<T>): Promise<T> {
  try {
    const response = await request();
    const logicalStatus = getLogicalStatus(response);

    if (logicalStatus === 401) {
      clearAuthSession();
      throw new ApiError(
        getLogicalMessage(response) || "Session expired. Please log in again.",
        401,
        response,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      throw new ApiError(
        error.message || "Session expired. Please log in again.",
        401,
        error.details,
      );
    }

    throw error;
  }
}

function getAccessToken() {
  const { accessToken, expiresAt } = useAuthStore.getState();

  if (!accessToken || isAccessTokenExpired(expiresAt)) {
    clearAuthSession();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  return accessToken;
}

export async function authenticatedPost<T>(
  url: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const jwt = getAccessToken();

  return runAuthenticatedRequest(() =>
    apiClient<T>(url, {
      method: "POST",
      body: JSON.stringify({
        token: API_TOKEN,
        jwt,
        ...body,
      }),
    }),
  );
}

export async function authenticatedFormPost<T>(
  url: string,
  formData?: FormData,
): Promise<T> {
  const jwt = getAccessToken();

  const requestBody = formData ?? new FormData();
  requestBody.append("token", API_TOKEN);
  requestBody.append("jwt", jwt);

  return runAuthenticatedRequest(() =>
    apiClient<T>(url, {
      method: "POST",
      body: requestBody,
    }),
  );
}

export async function authenticatedAdminPost<T>(
  url: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const jwt = getAccessToken();

  return runAuthenticatedRequest(() =>
    apiClient<T>(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        token: API_TOKEN,
        jwt,
        ...body,
      }),
    }),
  );
}
