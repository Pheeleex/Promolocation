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

    return {
      [pathname]: {
        target: url.origin,
        changeOrigin: true,
        secure: true,
      },
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
