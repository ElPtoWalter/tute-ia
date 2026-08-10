# QA — Sala Cero v21.2.0

## Comprobaciones estáticas

- 13 páginas HTML revisadas.
- Sin identificadores HTML duplicados.
- Sin referencias locales inexistentes.
- Todos los HTML contienen `device-mode-boot.js`, `device-mode.css` y `device-mode.js`.
- Todos los JavaScript superan `node --check`.
- Los 137 recursos incluidos en `CORE_ASSETS` existen.

## Comprobaciones de diseño

- 26 renderizados estáticos: 13 páginas en 390 × 844 y 13 páginas en 1440 × 900.
- Ninguna página presentó desplazamiento horizontal.
- «Es un 10 pero...» comprobado en 390 × 844 y 1440 × 900.
- Póker iniciado con un humano y cinco IA en 390 × 844 y 1440 × 900.
- Los seis asientos del Póker quedan visibles en móvil y ordenador sin tapar a Anton.
- Selector inicial renderizado en formato iPhone.

## Limitaciones de la comprobación

El entorno bloquea la navegación directa a `localhost` y a URL `file://`. Las pruebas visuales se realizaron cargando HTML, CSS y JavaScript localmente dentro del navegador automatizado. Los avisos de `localStorage` observados en esa prueba proceden del origen opaco del renderizado y no se reproducen al publicar la web mediante HTTPS.
