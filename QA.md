# Control de calidad — Tute IA v7

## Validaciones realizadas

- Sintaxis de `app.js` validada con Node.
- 40 caras SVG y un reverso SVG presentes.
- Los 41 SVG se pueden analizar como XML válido.
- Todas las rutas de cartas utilizadas por el motor existen.
- Carga inicial comprobada con ocho cartas para cada jugador.
- La mano del jugador conserva el orden aleatorio de reparto.
- Reordenación por arrastre comprobada con ratón.
- Reordenación comprobada mediante eventos táctiles reales en Chromium móvil.
- Robo manual comprobado: tras una baza, el contador de baceta pasa de 24 a 22.
- Partida completa automatizada hasta el resultado final.
- Al terminar la partida: cero cartas para ambos jugadores y baceta en cero.
- En la partida completa de prueba, los tantos de cartas y últimas sumaron 130.
- Sin errores de JavaScript ni errores de consola durante las pruebas.
- Diseño comprobado en vista de escritorio y móvil.
- Caché PWA incrementada a `tute-ia-v7.0.0`.
