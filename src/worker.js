// Worker de Palimpsesto (pedrogomez.dev/proyecto/palimpsesto).
// - /teselas/<capa>/<z>/<x>/<y>.<jpg|png>: pide la tesela al IGN (WMS o WMTS), la guarda en la
//   caché de Cloudflare y la sirve. Los WMS generan cada imagen al vuelo y tardan; cacheada, sale
//   al instante y no se vuelve a cargar al IGN con la misma petición.
// - Todo lo demás son archivos estáticos (dist/), con las cabeceras de _headers.
import { CAPAS, ESPANA, Z_MIN, origenTesela, teselaDe } from '../app/capas.js';

export const BASE = '/proyecto/palimpsesto';
const UN_MES = 60 * 60 * 24 * 30;
const RUTA = new RegExp(`^${BASE}/teselas/([a-z0-9-]+)/(\\d{1,2})/(\\d{1,7})/(\\d{1,7})\\.(jpg|png)$`);
const porId = new Map(CAPAS.map(c => [c.id, c]));

const texto = (estado, mensaje) => new Response(mensaje, {
    status: estado,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
});

// Sólo teselas dentro de España y de los zooms que tiene cada capa
export function validarTesela(id, z, x, y, extension) {
    const capa = porId.get(id);
    if (!capa) return { error: 'Capa desconocida' };
    if (extension !== capa.formato) return { error: 'Formato no válido' };
    if (z < Z_MIN || z > capa.zMax) return { error: 'Zoom fuera de rango' };
    const min = teselaDe(ESPANA.oeste, ESPANA.norte, z);
    const max = teselaDe(ESPANA.este, ESPANA.sur, z);
    if (x < min.x || x > max.x || y < min.y || y > max.y) return { error: 'Fuera de España' };
    return { capa };
}

async function tesela(request, ctx, partes) {
    const [, id, zs, xs, ys, extension] = partes;
    const z = Number(zs), x = Number(xs), y = Number(ys);
    const { capa, error } = validarTesela(id, z, x, y, extension);
    if (error) return texto(404, error);

    const cache = caches.default;
    const clave = new Request(new URL(request.url).toString(), { method: 'GET' });
    const guardada = await cache.match(clave);
    if (guardada) return guardada;

    let origen;
    try {
        origen = await fetch(origenTesela(capa, z, x, y), {
            headers: { 'User-Agent': 'Palimpsesto (pedrogomez.dev/proyecto/palimpsesto)' },
            cf: { cacheTtl: UN_MES, cacheEverything: true },
            signal: AbortSignal.timeout(20000)
        });
    } catch {
        return texto(502, 'El IGN no responde');
    }
    const tipo = origen.headers.get('Content-Type') || '';
    // Los WMS devuelven los errores como XML con un 200: sólo vale si es una imagen
    if (!origen.ok || !tipo.startsWith('image/')) return texto(502, 'El IGN no ha devuelto la tesela');

    const respuesta = new Response(origen.body, {
        headers: {
            'Content-Type': tipo,
            'Cache-Control': `public, max-age=${UN_MES}`,
            'X-Content-Type-Options': 'nosniff'
        }
    });
    ctx.waitUntil(cache.put(clave, respuesta.clone()));
    return respuesta;
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (!['GET', 'HEAD'].includes(request.method)) return texto(405, 'Método no permitido');
        const partes = url.pathname.match(RUTA);
        if (partes) return tesela(request, ctx, partes);
        return env.ASSETS.fetch(request);
    }
};
