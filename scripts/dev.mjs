// Palimpsesto en local sin Wrangler: ejecuta el Worker real (src/worker.js) en Node, con la
// caché de Cloudflare en memoria y los archivos de dist/ como ASSETS (con la CSP de _headers).
//   npm run build && node scripts/dev.mjs     → http://127.0.0.1:8030/proyecto/palimpsesto/
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8030);
const origin = `http://127.0.0.1:${port}`;

const memoria = new Map();
globalThis.caches = {
    default: {
        async match(request) { const r = memoria.get(request.url); return r ? r.clone() : undefined; },
        async put(request, response) { memoria.set(request.url, response); }
    }
};

const csp = (await readFile(resolve(repo, 'dist', '_headers'), 'utf8')).match(/Content-Security-Policy: (.+)/)[1];
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const ASSETS = {
    async fetch(request) {
        let ruta = decodeURIComponent(new URL(request.url).pathname);
        if (ruta.endsWith('/')) ruta += 'index.html';
        const archivo = resolve(repo, 'dist', `.${ruta}`);
        if (!archivo.startsWith(resolve(repo, 'dist'))) return new Response('No', { status: 403 });
        try {
            return new Response(await readFile(archivo), { headers: { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream', 'Content-Security-Policy': csp } });
        } catch {
            return new Response('No encontrado', { status: 404 });
        }
    }
};
const worker = (await import(pathToFileURL(resolve(repo, 'src', 'worker.js')).href)).default;

http.createServer(async (req, res) => {
    if (req.url === '/' || req.url === '/proyecto/palimpsesto') {
        res.writeHead(302, { Location: '/proyecto/palimpsesto/' });
        return res.end();
    }
    const pendientes = [];
    const respuesta = await worker.fetch(new Request(origin + req.url, { method: req.method }), { ASSETS }, { waitUntil: p => pendientes.push(p) });
    res.writeHead(respuesta.status, Object.fromEntries(respuesta.headers));
    res.end(Buffer.from(await respuesta.arrayBuffer()));
    await Promise.all(pendientes);
}).listen(port, '127.0.0.1', () => console.log(`Palimpsesto en local: ${origin}/proyecto/palimpsesto/`));
