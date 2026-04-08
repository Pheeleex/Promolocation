import { ApiError } from "../../types/auth";

const CONFIGURED_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getBaseUrl() {
  if (!import.meta.env.DEV) {
    return CONFIGURED_BASE_URL;
  }

  if (!CONFIGURED_BASE_URL) {
    return "";
  }

  try {
    const url = new URL(CONFIGURED_BASE_URL);
    const pathname = url.pathname.replace(/\/+$/, "");

    return pathname === "/" ? "" : pathname;
  } catch {
    return CONFIGURED_BASE_URL;
  }
}

const BASE_URL = getBaseUrl();

function buildUrl(path: string) {
  if (!BASE_URL) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const normalizedBaseUrl = BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const response = await fetch(buildUrl(path), {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options?.headers || {}),
    },
    ...options,
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || "Request failed",
      response.status,
      data,
    );
  }

  return data as T;
}
