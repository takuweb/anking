import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function syncServerPlugin(): Plugin {
  const syncStore = new Map<string, { data: unknown; createdAt: number }>();

  // 15分以上経過した一時データをクリーンアップ
  setInterval(() => {
    const now = Date.now();
    for (const [code, item] of syncStore.entries()) {
      if (now - item.createdAt > 15 * 60 * 1000) {
        syncStore.delete(code);
      }
    }
  }, 60 * 1000);

  return {
    name: 'sync-server-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/sync')) {
          return next();
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

        // POST /api/sync/push : データを預けて6桁コードを発行
        if (req.method === 'POST' && url.pathname === '/api/sync/push') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              let code = '';
              do {
                code = Math.floor(100000 + Math.random() * 900000).toString();
              } while (syncStore.has(code));

              syncStore.set(code, { data: parsed.data, createdAt: Date.now() });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, code, expiresIn: 900 }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
          });
          return;
        }

        // GET /api/sync/pull/:code : 6桁コードでデータを取得
        if (req.method === 'GET' && url.pathname.startsWith('/api/sync/pull/')) {
          const code = url.pathname.replace('/api/sync/pull/', '').trim();
          const item = syncStore.get(code);
          if (!item) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: '引き継ぎコードが見つからないか、有効期限（15分）が切れています' }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, data: item.data }));
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 相対パスにすることでローカルファイル直開きや配布に対応
  plugins: [react(), syncServerPlugin()],
  server: {
    port: 5173,
    host: true, // LAN内のスマホからもアクセス可能にする
    open: true, // 開発サーバー起動時に自動でブラウザを開く
  },
});
