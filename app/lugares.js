// Lugares de Granada para empezar a comparar. Cada nota describe lo que se ve al pasar la cortina
// entre las dos capas indicadas; nada que no esté en las propias imágenes.
export const LUGARES = [
    {
        id: 'centro',
        nombre: 'Centro',
        centro: [-3.5985, 37.1765], zoom: 15,
        antes: '1956', despues: 'hoy',
        nota: 'La Gran Vía ya cortaba en diagonal el casco antiguo en 1956. Lo que ha cambiado es el borde: la ciudad compacta de entonces terminaba en huertas.'
    },
    {
        id: 'alhambra',
        nombre: 'Alhambra',
        centro: [-3.5887, 37.1761], zoom: 15.5,
        antes: '1956', despues: 'hoy',
        nota: 'La colina de la Alhambra y su bosque son de lo poco que se superpone casi sin diferencias en setenta años.'
    },
    {
        id: 'zaidin',
        nombre: 'Zaidín',
        centro: [-3.594, 37.158], zoom: 15,
        antes: '1956', despues: 'hoy',
        nota: 'En 1956 aquí había vega: parcelas de cultivo y algún grupo de viviendas suelto. Hoy es uno de los barrios más poblados de Granada, con el estadio y la circunvalación al sur.'
    },
    {
        id: 'chana',
        nombre: 'La Chana',
        centro: [-3.628, 37.19], zoom: 15,
        antes: '1956', despues: 'hoy',
        nota: 'La carretera y la vía del tren atravesaban huertas. Hoy las acompaña la circunvalación, y al oeste todavía quedan parcelas de la vega.'
    },
    {
        id: 'cartuja',
        nombre: 'Cartuja',
        centro: [-3.598, 37.193], zoom: 15,
        antes: '1956', despues: 'hoy',
        nota: 'El monasterio de la Cartuja asomaba entre olivares y cerros. Hoy lo rodean el campus universitario y bloques de viviendas que suben por la ladera.'
    },
    {
        id: 'pts',
        nombre: 'Parque de la Salud',
        centro: [-3.607, 37.147], zoom: 15,
        antes: '1956', despues: 'hoy',
        nota: 'Todo esto era vega en 1956: parcelas regadas y caminos de tierra. Hoy hay un nudo de la circunvalación, el Parque Tecnológico de la Salud con su hospital y grandes superficies comerciales.'
    },
    {
        id: 'planos',
        nombre: 'Granada dibujada',
        centro: [-3.596, 37.177], zoom: 14,
        antes: 'planimetrias', despues: 'mapa',
        nota: 'En la planimetría dibujada a mano, la ciudad es una mancha rayada: lo que se medía alrededor eran caminos, acequias y cortijos. Pasa la cortina y mira qué ocupa hoy cada camino.'
    }
];

export const INICIO = { lugar: 'centro' };
