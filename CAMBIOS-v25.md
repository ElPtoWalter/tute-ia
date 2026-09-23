# Sala Cero v25.0 — Reforma integral de las mesas móviles

## Manos completas

- Sustituido el carrusel horizontal de cartas por un ajuste dinámico según el ancho real y el número de cartas.
- Tute individual, Tute local y Tute de 3/4 jugadores muestran de una vez manos de 8, 10 y 13 cartas.
- Chinchón, Escoba y Culo / Presidente comparten el mismo sistema; la prueba extrema cubre 14 cartas.
- Blackjack y los motores comunes de cartas también compactan sus manos sin recortar controles.
- El cálculo se actualiza tras repartos, robos, descartes, cambios de orientación y redimensionado.

## Tableros móviles

- Tute usa zonas estables para rival, tapete, acciones y mano.
- Chinchón, Escoba y Culo integran marcador, centro y mano en un único alto de pantalla; el marcador se abre como panel compacto superior.
- Póker mantiene mesa, seis plazas, cartas privadas y acciones dentro del viewport sin salto vertical.
- Los modos local y multi eliminan transformaciones heredadas que desplazaban la mano fuera de pantalla.
- Los teléfonos apaisados de hasta 960 px se reconocen como móvil y conservan las manos completas.

## Infraestructura

- Nuevos recursos compartidos `v25-mobile.css` y `v25-mobile.js` en las 27 páginas.
- Service worker y recursos versionados como `25.0.9`.
- Los nuevos recursos forman parte del shell offline.
