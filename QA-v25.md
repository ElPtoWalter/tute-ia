# QA Sala Cero v25.0

## Comprobaciones automáticas

- 27 páginas HTML con viewport móvil, `v25-mobile.css` y `v25-mobile.js`.
- Referencias locales de HTML, CSS, JavaScript y manifest verificadas.
- Nuevos recursos v25 incluidos en el shell offline.
- Sintaxis JavaScript validada con `node --check`.
- Sin identificadores HTML duplicados.

## Pruebas funcionales y visuales

- Tute a 390 × 844: 8 de 8 cartas completas, sin desplazamiento horizontal.
- Tute local a 360 × 800: 13 de 13 cartas completas y mano privada dentro del viewport.
- Tute de tres jugadores a 360 × 800: 13 de 13 cartas completas.
- Tute apaisado a 844 × 390: 13 de 13 cartas completas y detección móvil activa.
- Chinchón a 360 × 800: 7 de 7 cartas completas, tablero y mano en una sola pantalla.
- Culo / Presidente a 360 × 800: 14 de 14 cartas completas.
- Blackjack a 360 × 800: manos del crupier y jugador visibles con los cuatro controles accesibles.
- Póker a 360 × 800: seis plazas, mesa, cartas privadas y panel de acciones dentro del viewport y sin scroll de página.

## Publicación

Tras desplegar, abrir una vez con conexión y hacer una recarga completa para activar el shell `25.0.9`. Después comprobar Tute y otro juego en modo avión.
