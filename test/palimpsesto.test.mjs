import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPAS, cajaTesela, origenTesela, teselaDe, capa } from '../app/capas.js';
import { LUGARES, INICIO } from '../app/lugares.js';
import { validarTesela } from '../src/worker.js';

test('cada capa tiene lo que necesita la web y el Worker', () => {
    const ids = new Set();
    for (const c of CAPAS) {
        assert.ok(!ids.has(c.id), `id repetido: ${c.id}`);
        ids.add(c.id);
        assert.match(c.id, /^[a-z0-9-]+$/);
        assert.ok(['wms', 'wmts'].includes(c.tipo));
        assert.ok(['jpg', 'png'].includes(c.formato));
        assert.ok(c.anio && c.nombre && c.detalle);
        assert.ok(c.zMax >= 14 && c.zMax <= 19);
    }
});

test('los lugares apuntan a capas que existen y están en Granada', () => {
    assert.ok(LUGARES.some(l => l.id === INICIO.lugar));
    for (const l of LUGARES) {
        assert.ok(capa(l.antes) && capa(l.despues), l.id);
        const [lon, lat] = l.centro;
        assert.ok(lon > -3.75 && lon < -3.5 && lat > 37.1 && lat < 37.25, `${l.id} fuera de Granada`);
        assert.ok(l.nota.length > 40);
    }
});

test('la caja de una tesela en EPSG:3857 contiene el punto del que sale', () => {
    const { x, y } = teselaDe(-3.5985, 37.1765, 15);
    assert.deepEqual({ x, y }, { x: 16056, y: 12734 });
    const [oeste, sur, este, norte] = cajaTesela(15, x, y);
    const mx = (-3.5985 * 20037508.342789244) / 180;
    const my = Math.log(Math.tan(((90 + 37.1765) * Math.PI) / 360)) * (20037508.342789244 / Math.PI);
    assert.ok(mx > oeste && mx < este && my > sur && my < norte);
    assert.ok(Math.abs(este - oeste - 1222.99) < 0.01);
});

test('el Worker sólo pide al IGN teselas válidas dentro de España', () => {
    assert.equal(validarTesela('1956', 15, 16056, 12734, 'jpg').capa.id, '1956');
    assert.equal(validarTesela('1956', 15, 16056, 12734, 'png').error, 'Formato no válido');
    assert.equal(validarTesela('nada', 15, 16056, 12734, 'jpg').error, 'Capa desconocida');
    assert.equal(validarTesela('1956', 4, 7, 6, 'jpg').error, 'Zoom fuera de rango');
    assert.equal(validarTesela('1956', 19, 1, 1, 'jpg').error, 'Zoom fuera de rango');
    assert.equal(validarTesela('1956', 15, 1, 1, 'jpg').error, 'Fuera de España');
    const paris = teselaDe(2.35, 48.85, 12);
    assert.equal(validarTesela('hoy', 12, paris.x, paris.y, 'jpg').error, 'Fuera de España');
});

test('las direcciones del IGN son las de sus servicios WMS y WMTS', () => {
    const wms = new URL(origenTesela(capa('1956'), 15, 16056, 12734));
    assert.equal(wms.origin + wms.pathname, 'https://www.ign.es/wms/pnoa-historico');
    assert.equal(wms.searchParams.get('LAYERS'), 'AMS_1956-1957');
    assert.equal(wms.searchParams.get('CRS'), 'EPSG:3857');
    assert.equal(wms.searchParams.get('BBOX').split(',').length, 4);
    const wmts = new URL(origenTesela(capa('mapa'), 15, 16056, 12734));
    assert.equal(wmts.pathname, '/wmts/ign-base');
    assert.equal(wmts.searchParams.get('TileRow'), '12734');
    assert.equal(wmts.searchParams.get('format'), 'image/png');
});
