// Precalienta la caché de Cloudflare con las teselas de los lugares de Granada (zoom 13 a 16),
// para que la primera visita no espere a que el IGN genere cada imagen.
//   node scripts/precalentar.mjs [https://www.pedrogomez.dev]
import { capa, teselaDe } from '../app/capas.js';
import { LUGARES } from '../app/lugares.js';

const origen = (process.argv[2] || 'https://www.pedrogomez.dev').replace(/\/$/, '');
const tareas = new Set();
for (const lugar of LUGARES) {
    for (const id of [lugar.antes, lugar.despues]) {
        const c = capa(id);
        for (let z = 13; z <= 16; z++) {
            const { x, y } = teselaDe(lugar.centro[0], lugar.centro[1], z);
            const r = z >= 15 ? 3 : 2; // alrededor del centro, como una pantalla
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) tareas.add(`${origen}/proyecto/palimpsesto/teselas/${c.id}/${z}/${x + dx}/${y + dy}.${c.formato}`);
            }
        }
    }
}

const lista = [...tareas];
let hechas = 0, fallos = 0;
async function trabajador() {
    while (lista.length) {
        const url = lista.pop();
        const respuesta = await fetch(url).catch(() => null);
        if (!respuesta?.ok) fallos++;
        await respuesta?.arrayBuffer();
        if (++hechas % 100 === 0) console.log(`${hechas} teselas…`);
    }
}
await Promise.all(Array.from({ length: 6 }, trabajador));
console.log(`Listo: ${hechas} teselas, ${fallos} fallos.`);
