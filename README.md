# Palimpsesto

**Granada, capa a capa: la misma ciudad en dos épocas, con una cortina que se arrastra.**

Un palimpsesto es un pergamino que se raspaba para volver a escribir encima, y en el que todavía se lee lo de debajo. Una ciudad funciona igual. Palimpsesto pone una sobre otra las planimetrías dibujadas a mano por el Instituto Geográfico (1870-1950), el vuelo americano de 1956 y la ortofoto de hoy, y deja ver lo de debajo.

En vivo: **[pedrogomez.dev/proyecto/palimpsesto](https://pedrogomez.dev/proyecto/palimpsesto/)**

## Qué hay dentro

- **Tres formas de comparar.** *Cortina*: una línea que se arrastra (también con el teclado). *Lupa*: un círculo que sigue al puntero y enseña la otra época. *Fundido*: una sobre otra con transparencia.
- **Siete capas del IGN.** Planimetrías (1870-1950), primera edición del MTN50 (1875-1968), vuelo americano (1956-1957), vuelo interministerial (1973-1986), vuelo nacional (1981-1986), ortofoto PNOA actual y mapa base. Cubren toda España: Granada es el punto de partida, no el límite.
- **Lugares con nota.** Centro, Alhambra, Zaidín, La Chana, Cartuja, el Parque Tecnológico de la Salud y la Granada dibujada. Cada nota describe sólo lo que se ve al pasar la cortina.
- **Vistas que se comparten.** La URL guarda posición, épocas, modo y cortina: `#15/37.1765/-3.5985/1956/hoy/cortina/0.5`.

## Cómo está hecho

| Pieza | Dónde |
| --- | --- |
| Catálogo de capas y cálculo de teselas | `app/capas.js` |
| Lugares y notas | `app/lugares.js` |
| Mapas, sincronización, cortina, lupa y fundido | `app/palimpsesto.js`, `app/palimpsesto.css` |
| Proxy de teselas con caché | `src/worker.js` |
| Build | `scripts/build.mjs` |
| Vista local sin Wrangler | `scripts/dev.mjs` |
| Precalentar la caché | `scripts/precalentar.mjs` |

- **Dos mapas, uno encima del otro.** Dos instancias de [MapLibre GL JS](https://maplibre.org/) sincronizadas. El de arriba se recorta con `clip-path` (un rectángulo para la cortina, un círculo para la lupa), y como `clip-path` también recorta los clics, cada gesto lo recibe el mapa que se ve en ese punto y arrastra al otro.
- **Teselas del IGN a través de un Worker.** Los servicios WMS generan cada imagen al vuelo y tardan. El Worker convierte cada tesela `{z}/{x}/{y}` en la petición WMS (caja en EPSG:3857) o WMTS que corresponde, valida que sea una capa conocida, de un zoom permitido y dentro de España, y la guarda en la caché de Cloudflare. La segunda vez sale al instante y el IGN no recibe la misma petición dos veces.
- **Sin dependencias en el navegador** salvo MapLibre, que se sirve desde el propio dominio. CSP estricta en `_headers`.

## Datos

Todas las capas son del [Instituto Geográfico Nacional](https://www.ign.es/) (CNIG), con licencia [CC BY 4.0](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf): «© Instituto Geográfico Nacional». MapLibre GL JS tiene licencia BSD-3-Clause.

## Desarrollo

```bash
npm install
npm test          # catálogo, lugares, cálculo de teselas y validación del Worker
npm run build     # genera dist/proyecto/palimpsesto
node scripts/dev.mjs   # http://127.0.0.1:8030/proyecto/palimpsesto/ con el Worker real
```

## Despliegue

Worker de Cloudflare con archivos estáticos (`wrangler.jsonc`), enganchado a `pedrogomez.dev/proyecto/palimpsesto`.

```bash
npm run deploy
node scripts/precalentar.mjs   # deja en caché los lugares de Granada
```
