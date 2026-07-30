# QA — Sala Cero v21.1.0

Comprobaciones ejecutadas:

- `es-un-10.html`, `es-un-10.css` y `es-un-10.js` incluidos en la raíz.
- Juego visible desde la portada y navegación principal.
- Portada contiene siete juegos y no genera desbordamiento horizontal a 390 y 1440 px.
- Las 40 cartas de Tute existen y pueden ser seleccionadas.
- La baraja comienza boca abajo.
- El botón pasa de «Mostrar carta» a «Terminar ronda y barajar».
- Al finalizar la ronda se oculta la carta, se barajan las 40 cartas y aumenta el contador.
- Prueba funcional en navegador: ronda 1 preparada, carta revelada, ronda 2 preparada.
- Vista móvil comprobada a 390 × 844 y 360 × 800.
- Vista de escritorio comprobada a 1440 × 1000.
- Sin desbordamiento horizontal en las vistas comprobadas.
- Todos los JavaScript superan `node --check`.
- Todos los recursos y enlaces locales de los HTML existen.
- Los recursos esenciales de la PWA existen y el nuevo juego está incluido en la caché offline.
