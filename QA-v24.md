# QA Sala Cero v24.0

## Comprobaciones automáticas

- 27 páginas HTML con viewport móvil, `v24-responsive.css` y `v24-ui.js`.
- 562 referencias locales de HTML, CSS y manifest verificadas.
- 169 recursos del shell offline presentes.
- Manifest válido y sin archivos referenciados ausentes.
- Sintaxis validada con `node --check` para todos los JavaScript.
- Sin identificadores HTML duplicados detectados.

## Pruebas funcionales y visuales

- Portada probada a 390 × 844 px: sin selector de dispositivo, sin bloqueo de cuenta y sin desbordamiento horizontal.
- Buscador comprobado con “tabú”, devolviendo solo el juego correspondiente.
- Tute probado desde selección de variante hasta mesa repartida; todas las zonas quedan dentro de 390 px y la mano permanece accesible por desplazamiento horizontal.
- Generala probada desde configuración hasta mesa de juego, con tirada principal y marcador accesibles.
- Chao Pescao probado desde preparación hasta inicio de ronda.
- Póker revisado en portada móvil.
- Portada revisada también a 1280 × 720 px, conservando su cuadrícula de escritorio.

## Publicación

Tras desplegar, abrir una vez con conexión y recargar para activar el shell `24.0.1`. Después comprobar la portada y una partida en modo avión.
