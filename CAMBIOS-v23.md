# Sala Cero v23.0 — Expansión total de juegos

## Catálogo

Sala Cero pasa de 9 a **21 juegos**.

Nuevos motores independientes:
1. Chao Pescao — respuesta real oculta + faroles escritos por los jugadores + pescador.
2. Mentiroso de dados — dados secretos, apuestas crecientes, desafío y eliminación de dados.
3. 7 y Media — casino con baraja española, fichas, apuestas y banca automática.
4. La Bomba — categorías y temporizador aleatorio oculto.
5. ¿Quién es más probable? — banco offline de preguntas y cuenta atrás sincronizada.
6. El Mentiroso — cartas boca abajo, declaración, desafío y recogida del montón.
7. Presidente Express — descarte ascendente, grupos de cartas, pases y clasificación.
8. La Pirámide — memoria, pirámide de 15 cartas, puntuación por filas y Autobús final.
9. Tabú de Antón — dos equipos, palabras prohibidas, cronómetro y marcador.
10. Password — dos equipos, palabra secreta, pistas alternas y puntuación por rapidez.
11. Ruleta del Caos — 12 familias de minijuegos con pruebas offline aleatorias.
12. El Juicio de Antón — acusado, fiscal, abogado, intervenciones cronometradas y jurado.

## UX

- Nueva interfaz compartida `v23-games.css` para los doce juegos.
- Controles táctiles de 48–50 px como mínimo.
- Pantallas privadas de “pasa el móvil” en juegos con manos, dados o respuestas secretas.
- Tipografía y jerarquía reajustadas para iPhone y escritorio.
- Ayuda de reglas integrada en cada juego.
- Sonidos y vibración opcionales mediante APIs del propio navegador, sin archivos extra.
- Portada ampliada con navegación por Clásicos, Casino, Party, Palabras y Faroleo.

## PWA / offline

- Service worker actualizado a `23.0.0`.
- Los 12 HTML y 12 JS nuevos, `v23-common.js`, `v23-games.css` y `hub-v23.css` forman parte de la caché offline.
- Manifest actualizado a 21 juegos y con accesos rápidos para varios juegos nuevos.
- Recursos existentes cache-busteados a `v=23.0.0` para evitar mezclas con la v22.
