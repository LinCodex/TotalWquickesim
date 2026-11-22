import { defineConfig, type Connect, type Plugin } from 'vite';
import { resolve } from 'node:path';

const CLEAN_ROUTE_MAP: Record<string, string> = {
  '/lpascan': '/index.html',
  '/activate': '/activate/index.html',
  '/redirect': '/redirect/index.html'
};

function applyCleanRouteRewrite(req: Connect.IncomingMessage): boolean {
  const rawUrl = req.url || '/';
  const [pathname, search = ''] = rawUrl.split('?');
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const suffix = search ? `?${search}` : '';

  const mapped = CLEAN_ROUTE_MAP[normalized];
  if (mapped) {
    req.url = `${mapped}${suffix}`;
    return true;
  }
  return false;
}

function cleanRoutesPlugin(): Plugin {
  return {
    name: 'totalw-clean-routes',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        applyCleanRouteRewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        applyCleanRouteRewrite(req);
        next();
      });
    }
  };
}

export default defineConfig({
  publicDir: 'public',
  plugins: [cleanRoutesPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        activate: resolve('activate/index.html'),
        redirect: resolve('redirect/index.html')
      }
    }
  }
});
