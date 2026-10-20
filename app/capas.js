// Capas de Palimpsesto: todas son servicios abiertos del Instituto Geográfico Nacional (CC BY 4.0).
// Las usa la web (etiquetas y orden) y el Worker (de dónde sale cada tesela). El Worker las pide
// al IGN, las guarda en la caché de Cloudflare y las sirve como teselas normales {z}/{x}/{y}.
export const ATRIBUCION = '© <a href="https://www.ign.es/" target="_blank" rel="noopener">Instituto Geográfico Nacional</a> · CC BY 4.0';

export const CAPAS = [
    {
        id: 'planimetrias',
        anio: '1870–1950',
        nombre: 'Planimetrías',
        detalle: 'Minutas dibujadas a mano por el Instituto Geográfico para el primer mapa topográfico de España.',
        tipo: 'wms', servicio: 'minutas-cartograficas', capa: 'Minutas', formato: 'jpg', zMax: 18
    },
    {
        id: 'mtn50',
        anio: '1875–1968',
        nombre: 'Primer mapa topográfico',
        detalle: 'Primera edición del Mapa Topográfico Nacional a escala 1:50.000, hoja a hoja.',
        tipo: 'wms', servicio: 'primera-edicion-mtn', capa: 'MTN50', formato: 'jpg', zMax: 16
    },
    {
        id: '1956',
        anio: '1956',
        nombre: 'Vuelo americano',
        detalle: 'Fotografía aérea de la serie B, tomada en 1956 y 1957 con el Ejército del Aire.',
        tipo: 'wms', servicio: 'pnoa-historico', capa: 'AMS_1956-1957', formato: 'jpg', zMax: 18
    },
    {
        id: '1977',
        anio: '1973–1986',
        nombre: 'Vuelo interministerial',
        detalle: 'Fotografía aérea de los años setenta y ochenta, en blanco y negro.',
        tipo: 'wms', servicio: 'pnoa-historico', capa: 'Interministerial_1973-1986', formato: 'jpg', zMax: 18
    },
    {
        id: '1984',
        anio: '1981–1986',
        nombre: 'Vuelo nacional',
        detalle: 'Fotografía aérea de mediados de los ochenta.',
        tipo: 'wms', servicio: 'pnoa-historico', capa: 'Nacional_1981-1986', formato: 'jpg', zMax: 18
    },
    {
        id: 'hoy',
        anio: 'Hoy',
        nombre: 'Ortofoto',
        detalle: 'La ortofoto más reciente del Plan Nacional de Ortofotografía Aérea (PNOA).',
        tipo: 'wmts', servicio: 'pnoa-ma', capa: 'OI.OrthoimageCoverage', formato: 'jpg', zMax: 19
    },
    {
        id: 'mapa',
        anio: 'Hoy',
        nombre: 'Mapa',
        detalle: 'Mapa base del IGN: calles, nombres y edificios de hoy.',
        tipo: 'wmts', servicio: 'ign-base', capa: 'IGNBaseTodo', formato: 'png', zMax: 19
    }
];

export const capa = id => CAPAS.find(c => c.id === id);

// Límites de las teselas que se sirven: toda España, del zoom 5 al máximo de cada capa
export const Z_MIN = 5;
export const ESPANA = { oeste: -18.5, sur: 27.4, este: 4.6, norte: 44.0 };

// Caja en metros (EPSG:3857) de la tesela z/x/y
export function cajaTesela(z, x, y) {
    const mitad = 20037508.342789244;
    const lado = (2 * mitad) / 2 ** z;
    const oeste = -mitad + x * lado;
    const norte = mitad - y * lado;
    return [oeste, norte - lado, oeste + lado, norte];
}

// Columna y fila de la tesela que contiene un punto (para comprobar que está en España)
export function teselaDe(lon, lat, z) {
    const n = 2 ** z;
    const x = Math.floor(((lon + 180) / 360) * n);
    const rad = (lat * Math.PI) / 180;
    const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
    return { x, y };
}

// Dirección del IGN de la que sale una tesela
export function origenTesela(c, z, x, y) {
    if (c.tipo === 'wmts') {
        const formato = c.formato === 'png' ? 'image/png' : 'image/jpeg';
        return `https://www.ign.es/wmts/${c.servicio}?service=WMTS&request=GetTile&version=1.0.0&layer=${encodeURIComponent(c.capa)}`
            + `&style=default&tilematrixset=GoogleMapsCompatible&format=${encodeURIComponent(formato)}&TileMatrix=${z}&TileCol=${x}&TileRow=${y}`;
    }
    const caja = cajaTesela(z, x, y).map(v => v.toFixed(3)).join(',');
    return `https://www.ign.es/wms/${c.servicio}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${encodeURIComponent(c.capa)}`
        + `&STYLES=&CRS=EPSG:3857&BBOX=${caja}&WIDTH=256&HEIGHT=256&FORMAT=image%2Fjpeg`;
}
