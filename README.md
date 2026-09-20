# Sala Cero v24.0

Sala Cero es una colección de **21 juegos offline** optimizada para móvil/iPhone y ordenador. La versión 24 prioriza una entrada inmediata, una navegación táctil coherente y partidas realmente utilizables en pantallas pequeñas, sin obligar a crear una cuenta.

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

Las 27 páginas comparten ahora una capa responsive v24. El dispositivo se detecta automáticamente, sin selector previo; la portada incorpora buscador, filtros y navegación inferior móvil. Las mesas compactan paneles, respetan las zonas seguras de iPhone y mantienen los controles esenciales visibles. El acceso invitado queda disponible desde el primer momento.

## Offline

El service worker v24.0.1 incluye las páginas, estilos y motores de los 21 juegos, además de una ruta de recuperación offline para todas las páginas. No se necesita ninguna API para los juegos: preguntas, palabras, categorías, retos y lógica se ejecutan localmente.

## Publicación

Sube directamente todo el contenido de este paquete a la raíz del repositorio de GitHub Pages. `index.html`, `sw.js` y `manifest.webmanifest` deben quedar en la raíz.

Consulta `CAMBIOS-v24.md`, `QA-v24.md` e `INSTALACION.md`.
