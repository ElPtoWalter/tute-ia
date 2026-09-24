# Sala Cero v26.0.3 — Cambios

## Brisca

- Nueva mesa con baraja española y reglas completas de baza, triunfo, robo y puntuación.
- Partida individual contra Doña Virtud.
- Multijugador local para dos, tres o cuatro personas, con cambio de mano privado.
- La variante de tres participantes utiliza 39 cartas para que el reparto sea exacto.
- La mano rival nunca se muestra durante el turno de la IA.
- Integración con Club, logros, historial y estadísticas globales.

## Estadísticas globales

- Registro común para los 22 juegos mediante `stats-v26.js`.
- Sesiones, partidas terminadas, victorias, derrotas, racha actual, mejor racha y tiempo jugado.
- Actividad por juego, juego favorito, jugadores locales e historial reciente.
- Importación única y segura de las estadísticas anteriores de Sala Cero.
- Nuevos logros por Brisca, diez juegos distintos y catálogo completo.

## Móvil y estabilidad

- Corrección de cabeceras estrechas en Generala y Póker.
- Corrección del halo decorativo de Póker en teléfono horizontal.
- Mano de Brisca completamente visible en vertical y horizontal.
- Caché PWA renovada a `26.0.3` e inclusión de los recursos nuevos.
- Corrección de textos que todavía describían un catálogo de cuatro juegos.

## Calidad continua

- Validación estructural de las 28 páginas, referencias locales, IDs y manifiesto.
- Playwright sobre cuatro viewports y los 22 juegos.
- Smoke tests de Brisca, Tute, Generala, Chinchón y Blackjack.
- Workflow de GitHub Actions con informe HTML descargable cuando falla una prueba.
