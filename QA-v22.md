# QA — Sala Cero v22.0.0

Comprobaciones realizadas antes de empaquetar:

- 13 páginas HTML revisadas a 390 × 844 px.
- La portada y las pantallas iniciales de los 9 juegos mantienen el ancho del viewport sin scroll horizontal.
- Corrección específica de las dos mesas de Tute que más sufrían en móvil: `local.html` y `multi.html`.
- Render de control en escritorio (1440 × 900) para portada, Tute, Generala, Póker, Blackjack e Impostor.
- Todos los JavaScript del paquete pasan `node --check`.
- Referencias locales de HTML comprobadas; no faltan recursos reales.
- Los 124 recursos del núcleo del service worker existen.
- Eliminadas las capas de autenticación, carrera/progresión y selector manual de dispositivo.
- Conservados únicamente los nombres que forman parte de una partida multijugador local.
- Safe areas de iPhone, controles táctiles y formularios preparados para Safari móvil.
