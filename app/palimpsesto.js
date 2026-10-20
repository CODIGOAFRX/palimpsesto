// Palimpsesto: dos mapas idénticos, uno encima del otro, cada uno con una época. El de arriba
// («antes») se recorta según el modo: una cortina vertical, una lupa que sigue al puntero o un
// fundido. Los dos se mueven juntos. La vista se guarda en la URL para poder compartirla.
import { Map as MapaGL, AttributionControl, NavigationControl } from './vendor/maplibre-gl.mjs';
import { CAPAS, ATRIBUCION, ESPANA, capa } from './capas.js';
import { LUGARES, INICIO } from './lugares.js';

const BASE = '/proyecto/palimpsesto';
const $ = id => document.getElementById(id);
const reducir = matchMedia('(prefers-reduced-motion: reduce)');
const LUPA = () => Math.min(170, Math.max(110, innerWidth * 0.14));

// ---------- estado (de la URL o del lugar de inicio) ----------
const inicio = LUGARES.find(l => l.id === INICIO.lugar);
const estado = {
    centro: inicio.centro, zoom: inicio.zoom,
    antes: inicio.antes, despues: inicio.despues,
    modo: 'cortina', cortina: 0.5, fundido: 0.6,
    lupa: { x: innerWidth / 2, y: innerHeight / 2 },
    lugar: inicio.id
};
leerUrl();

// ---------- mapas ----------
const estilo = id => {
    const c = capa(id);
    return {
        version: 8,
        sources: {
            epoca: {
                type: 'raster',
                tiles: [`${BASE}/teselas/${c.id}/{z}/{x}/{y}.${c.formato}`],
                tileSize: 256, minzoom: 5, maxzoom: c.zMax,
                bounds: [ESPANA.oeste, ESPANA.sur, ESPANA.este, ESPANA.norte],
                attribution: ATRIBUCION
            }
        },
        layers: [
            { id: 'papel', type: 'background', paint: { 'background-color': '#ebe5d8' } },
            { id: 'epoca', type: 'raster', source: 'epoca', paint: { 'raster-fade-duration': 160 } }
        ]
    };
};

const opciones = id => ({
    style: estilo(id),
    center: estado.centro, zoom: estado.zoom,
    minZoom: 6, maxZoom: 19,
    maxBounds: [[ESPANA.oeste - 2, ESPANA.sur - 2], [ESPANA.este + 2, ESPANA.norte + 2]],
    dragRotate: false, pitchWithRotate: false, touchPitch: false,
    attributionControl: false, fadeDuration: 0
});

const despues = new MapaGL({ container: 'mapa-despues', ...opciones(estado.despues) });
const antes = new MapaGL({ container: 'mapa-antes', ...opciones(estado.antes) });
despues.touchZoomRotate.disableRotation();
antes.touchZoomRotate.disableRotation();
despues.addControl(new AttributionControl({ compact: true }), 'bottom-right');
despues.addControl(new NavigationControl({ showCompass: false }), 'top-right');

// Los dos mapas se mueven a la vez: el que recibe el gesto arrastra al otro
let sincronizando = false;
const sincronizar = (origen, destino) => origen.on('move', () => {
    if (sincronizando) return;
    sincronizando = true;
    destino.jumpTo({ center: origen.getCenter(), zoom: origen.getZoom() });
    sincronizando = false;
});
sincronizar(despues, antes);
sincronizar(antes, despues);
[antes, despues].forEach(m => m.on('moveend', escribirUrl));

function ponerCapa(mapa, id) {
    mapa.setStyle(estilo(id));
}

// ---------- recorte del mapa de arriba ----------
const capaAntes = $('mapa-antes');
const cortina = $('cortina');

function recortar() {
    const ancho = innerWidth;
    const x = estado.cortina * ancho;
    document.body.dataset.modo = estado.modo;
    if (estado.modo === 'cortina') {
        capaAntes.style.clipPath = `inset(0 ${(ancho - x).toFixed(1)}px 0 0)`;
        capaAntes.style.opacity = '1';
        cortina.style.transform = `translateX(${x.toFixed(1)}px)`;
        $('marca-antes').style.transform = `translateX(${(x - 12).toFixed(1)}px) translateX(-100%)`;
        $('marca-despues').style.transform = `translateX(${(x + 12).toFixed(1)}px)`;
    } else if (estado.modo === 'lupa') {
        const r = LUPA();
        capaAntes.style.clipPath = `circle(${r}px at ${estado.lupa.x}px ${estado.lupa.y}px)`;
        capaAntes.style.opacity = '1';
        Object.assign($('anillo').style, {
            width: `${2 * r}px`, height: `${2 * r}px`,
            transform: `translate(${estado.lupa.x - r}px, ${estado.lupa.y - r}px)`
        });
    } else {
        capaAntes.style.clipPath = 'none';
        capaAntes.style.opacity = String(estado.fundido);
    }
    const porcentaje = Math.round(estado.cortina * 100);
    cortina.setAttribute('aria-valuenow', String(porcentaje));
    cortina.setAttribute('aria-valuetext', `${porcentaje} % ${capa(estado.antes).anio}, el resto ${capa(estado.despues).anio}`);
}

// Cortina: se arrastra desde la línea o el asa, y con el teclado
let arrastrando = false;
cortina.addEventListener('pointerdown', evento => {
    arrastrando = true;
    cortina.setPointerCapture(evento.pointerId);
    document.body.classList.add('arrastrando');
});
cortina.addEventListener('pointermove', evento => {
    if (!arrastrando) return;
    estado.cortina = Math.min(1, Math.max(0, evento.clientX / innerWidth));
    recortar();
});
const soltar = () => {
    if (!arrastrando) return;
    arrastrando = false;
    document.body.classList.remove('arrastrando');
    escribirUrl();
};
cortina.addEventListener('pointerup', soltar);
cortina.addEventListener('pointercancel', soltar);
cortina.addEventListener('keydown', evento => {
    const paso = evento.shiftKey ? 0.1 : 0.02;
    const nuevo = { ArrowLeft: estado.cortina - paso, ArrowRight: estado.cortina + paso, Home: 0, End: 1 }[evento.key];
    if (nuevo === undefined) return;
    evento.preventDefault();
    estado.cortina = Math.min(1, Math.max(0, nuevo));
    recortar();
    escribirUrl();
});

// Lupa: sigue al puntero (y al dedo) por encima de los mapas
$('mapas').addEventListener('pointermove', evento => {
    if (estado.modo !== 'lupa') return;
    estado.lupa = { x: evento.clientX, y: evento.clientY };
    recortar();
}, { passive: true });

// ---------- mando: épocas y modo ----------
const selAntes = $('sel-antes'), selDespues = $('sel-despues');
for (const sel of [selAntes, selDespues]) {
    sel.innerHTML = CAPAS.map(c => `<option value="${c.id}">${c.anio} · ${c.nombre}</option>`).join('');
}
selAntes.addEventListener('change', () => cambiarEpocas(selAntes.value, estado.despues));
selDespues.addEventListener('change', () => cambiarEpocas(estado.antes, selDespues.value));

function cambiarEpocas(idAntes, idDespues) {
    if (idAntes !== estado.antes) ponerCapa(antes, idAntes);
    if (idDespues !== estado.despues) ponerCapa(despues, idDespues);
    estado.antes = idAntes;
    estado.despues = idDespues;
    selAntes.value = idAntes;
    selDespues.value = idDespues;
    $('marca-antes').textContent = capa(idAntes).anio;
    $('marca-despues').textContent = capa(idDespues).anio;
    $('nota-capas').textContent = `${capa(idAntes).anio}: ${capa(idAntes).detalle} ${capa(idDespues).anio}: ${capa(idDespues).detalle}`;
    recortar();
    escribirUrl();
}

const botonesModo = [...document.querySelectorAll('[data-modo]')];
botonesModo.forEach(boton => boton.addEventListener('click', () => ponerModo(boton.dataset.modo)));
function ponerModo(modo) {
    estado.modo = modo;
    botonesModo.forEach(b => b.setAttribute('aria-checked', String(b.dataset.modo === modo)));
    $('fundido').hidden = modo !== 'fundido';
    cortina.hidden = modo !== 'cortina';
    recortar();
    escribirUrl();
}
$('fundido-valor').addEventListener('input', evento => {
    estado.fundido = Number(evento.target.value) / 100;
    recortar();
});

// ---------- lugares ----------
const lugares = $('lugares');
lugares.innerHTML = LUGARES.map(l => `<button type="button" data-lugar="${l.id}">${l.nombre}</button>`).join('');
lugares.addEventListener('click', evento => {
    const boton = evento.target.closest('[data-lugar]');
    if (boton) irA(LUGARES.find(l => l.id === boton.dataset.lugar));
});

function irA(lugar, { animar = true } = {}) {
    estado.lugar = lugar.id;
    cambiarEpocas(lugar.antes, lugar.despues);
    [...lugares.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lugar === lugar.id)));
    $('nota-titulo').textContent = lugar.nombre;
    $('nota-texto').textContent = lugar.nota;
    const destino = { center: lugar.centro, zoom: lugar.zoom };
    if (animar && !reducir.matches) despues.flyTo({ ...destino, speed: 1.4, curve: 1.3 });
    else despues.jumpTo(destino);
}

// ---------- URL: #zoom/lat/lon/antes/despues/modo/cortina ----------
function leerUrl() {
    const [z, lat, lon, a, d, modo, c] = location.hash.slice(1).split('/');
    if (!z) return;
    const num = v => Number.parseFloat(v);
    if ([z, lat, lon].every(v => Number.isFinite(num(v)))) {
        estado.zoom = num(z);
        estado.centro = [num(lon), num(lat)];
        estado.lugar = null;
    }
    if (capa(a)) estado.antes = a;
    if (capa(d)) estado.despues = d;
    if (['cortina', 'lupa', 'fundido'].includes(modo)) estado.modo = modo;
    if (Number.isFinite(num(c))) estado.cortina = Math.min(1, Math.max(0, num(c)));
}

let escritura = 0;
function escribirUrl() {
    cancelAnimationFrame(escritura);
    escritura = requestAnimationFrame(() => {
        const c = despues.getCenter();
        const hash = [despues.getZoom().toFixed(2), c.lat.toFixed(5), c.lng.toFixed(5), estado.antes, estado.despues, estado.modo, estado.cortina.toFixed(3)].join('/');
        history.replaceState(null, '', `#${hash}`);
    });
}

// ---------- arranque ----------
addEventListener('resize', recortar);
const lugarInicial = LUGARES.find(l => l.id === estado.lugar);
if (lugarInicial) irA(lugarInicial, { animar: false });
else {
    cambiarEpocas(estado.antes, estado.despues);
    $('nota-titulo').textContent = 'Tu vista';
    $('nota-texto').textContent = 'Elige un lugar para empezar o muévete por cualquier sitio de España: las capas del Instituto Geográfico cubren todo el país.';
}
ponerModo(estado.modo);
