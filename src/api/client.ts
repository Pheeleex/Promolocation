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

function buildAdminApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const configuredUrl = new URL(CONFIGURED_BASE_URL);
    return `${configuredUrl.origin}${normalizedPath}`;
  } catch {
    return normalizedPath;
  }
}

function buildUrl(path: string) {
  if (path.startsWith("/admin_api/")) {
    return buildAdminApiUrl(path);
  }

  if (!BASE_URL) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const normalizedBaseUrl = BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function normalizeHeaders(headers?: HeadersInit) {
  return Object.fromEntries(new Headers(headers).entries());
}

function normalizeBody(body?: BodyInit | null) {
  if (!body) {
    return null;
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  if (body instanceof FormData) {
    return Array.from(body.entries()).reduce<Record<string, unknown>>(
      (entries, [key, value]) => {
        entries[key] =
          value instanceof File
            ? {
                fileName: value.name,
                fileSize: value.size,
                fileType: value.type,
              }
            : value;

        return entries;
      },
      {},
    );
  }

  if (body instanceof URLSearchParams) {
    return Object.fromEntries(body.entries());
  }

  return body;
}

function logRequest(path: string, url: string, method: string, headers: Headers, body?: BodyInit | null) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.groupCollapsed(`[apiClient] ${method} ${path}`);
  console.log("url", url);
  console.log("headers", normalizeHeaders(headers));
  console.log("payload", normalizeBody(body));
  console.groupEnd();
}

function logResponse(path: string, url: string, status: number, data: unknown) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.log(`[apiClient] response ${status} ${path}`, {
    data,
    status,
    url,
  });
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = buildUrl(path);
  const isFormData = options?.body instanceof FormData;
  const headers = new Headers(isFormData ? undefined : { "Content-Type": "application/json" });
  const optionHeaders = new Headers(options?.headers);

  optionHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  const method = options?.method ?? "GET";
  logRequest(path, url, method, headers, options?.body);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  logResponse(path, url, response.status, data);

  if (!response.ok) {
    throw new ApiError(
      data?.message || "Request failed",
      response.status,
      data,
    );
  }

  return data as T;
}
