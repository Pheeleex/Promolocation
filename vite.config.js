import { defineConfig, loadEnv } from "vite";

function getApiProxy(apiBaseUrl) {
  if (!apiBaseUrl) {
    return undefined;
  }

  try {
    const url = new URL(apiBaseUrl);
    const pathname = url.pathname.replace(/\/+$/, "");

    if (!pathname) {
      return undefined;
    }

    const proxyConfig = {
      target: url.origin,
      changeOrigin: true,
      secure: true,
    };
    const adminPathname = pathname.endsWith("/api")
      ? pathname.replace(/\/api$/, "/admin_api")
      : "/admin_api";

    return {
      [pathname]: proxyConfig,
      [adminPathname]: proxyConfig,
    };
  } catch {
    return undefined;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxy = getApiProxy(env.VITE_API_BASE_URL);

  return {
    base: "./",
    server: apiProxy
      ? {
          proxy: apiProxy,
        }
      : undefined,
  };
});
