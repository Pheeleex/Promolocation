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

    return {
      [pathname]: proxyConfig,
      "/admin_api": proxyConfig,
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
