# Sala Cero v25.0

Sala Cero es una colección de **21 juegos offline** optimizada para móvil/iPhone y ordenador. La versión 25 reforma las mesas de juego y garantiza que las manos completas permanezcan visibles incluso con 13 o 14 cartas, tanto en vertical como en horizontal.

## Juegos incluidos

### Clásicos de Sala Cero
- Tute
- Generala
- Chinchón
- Escoba de 15
- Culo / Presidente
- Póker Texas Hold'em
- Es un 10 pero...
- Blackjack de Antón
- El Impostor

### Juegos de grupo
- Chao Pescao
- Mentiroso de dados
- 7 y Media
- La Bomba
- ¿Quién es más probable?
- El Mentiroso de cartas
- Presidente Express
- La Pirámide + Autobús
- Tabú de Antón
- Password
- Ruleta del Caos
- El Juicio de Antón

## Diseño y dispositivo

Las 27 páginas comparten las capas responsive v24 y v25. El dispositivo se detecta automáticamente, incluido un teléfono en horizontal; la portada incorpora buscador, filtros y navegación inferior móvil. Un motor común calcula el ancho y solapamiento de cada mano según el número de cartas y el espacio real disponible. Las mesas compactan paneles, respetan las zonas seguras de iPhone y mantienen los controles esenciales visibles. El acceso invitado queda disponible desde el primer momento.

## Offline

El service worker v25.0.9 incluye las páginas, estilos y motores de los 21 juegos, además de una ruta de recuperación offline para todas las páginas. No se necesita ninguna API para los juegos: preguntas, palabras, categorías, retos y lógica se ejecutan localmente.

## Publicación

Sube directamente todo el contenido de este paquete a la raíz del repositorio de GitHub Pages. `index.html`, `sw.js` y `manifest.webmanifest` deben quedar en la raíz.

Consulta `CAMBIOS-v25.md`, `QA-v25.md` e `INSTALACION.md`.
