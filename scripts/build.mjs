// Genera dist/proyecto/palimpsesto (servido en pedrogomez.dev/proyecto/palimpsesto) desde app/:
// copia la web y MapLibre (node_modules), versiona CSS y JS con un hash de su contenido y deja
// _headers en la raíz de dist, donde lo lee el Worker de archivos estáticos.
// Uso: node scripts/build.mjs
import { cp, mkdir, readFile, rm, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = '/proyecto/palimpsesto';
const dist = resolve(repo, 'dist');
const out = resolve(dist, base.slice(1));
const maplibre = resolve(repo, 'node_modules', 'maplibre-gl', 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(out, 'vendor'), { recursive: true });
await cp(resolve(repo, 'app'), out, { recursive: true });
for (const file of ['maplibre-gl.mjs', 'maplibre-gl-shared.mjs', 'maplibre-gl-worker.mjs', 'maplibre-gl.css']) {
    await cp(resolve(maplibre, file), resolve(out, 'vendor', file));
}
await cp(resolve(repo, 'node_modules', 'maplibre-gl', 'LICENSE.txt'), resolve(out, 'vendor', 'MAPLIBRE-LICENSE.txt'));
await rename(resolve(out, '_headers'), resolve(dist, '_headers'));

const hash = async file => createHash('sha256').update(await readFile(resolve(out, file))).digest('hex').slice(0, 10);
let html = await readFile(resolve(out, 'index.html'), 'utf8');
for (const [, file] of html.matchAll(/\{\{v:([^}]+)\}\}/g)) html = html.replace(`{{v:${file}}}`, await hash(file));
html = html.replaceAll('{{BASE}}', base);
await writeFile(resolve(out, 'index.html'), html);
console.log(`Generado ${out}`);
