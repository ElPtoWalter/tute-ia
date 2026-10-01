# Sala Cero v27.0.0

Sala Cero es una colección de **28 juegos casuales** para abrir y jugar sin registro. Abrir → elegir juego → jugar, en móvil, tablet, horizontal y escritorio. Disponible sin conexión tras completar la primera precarga.

## Catálogo

### Cartas y casino

- Tute
- Brisca
- Generala
- Chinchón
- Escoba de 15
- Culo / Presidente
- Cinquillo
- Pocha
- Burro
- Póker Texas Hold'em
- Blackjack
- Ruleta de Antón · europea, un cero, solo o mesa local 2–6, fichas virtuales
- 7 y Media
- Es un 10 pero…

### Party, palabras y dados

- El impostor
- Chao Pescao
- Mentiroso de dados
- La Bomba
- ¿Quién es más probable?
- El Mentiroso de cartas
- Presidente Express
- La Pirámide
- Tabú
- Password
- Ruleta del Caos
- El Juicio
- Charadas
- Dibuja

Un juego puede aparecer en varios filtros sin duplicarse en el catálogo. La portada permite filtrar por Todos, Cartas, Casino, Party, Palabras o Dados, buscar por nombre, elegir al azar y retomar juegos recientes.

## Qué cambia en v27

- Ruleta de Antón independiente de Ruleta del Caos: 37 casillas, apuestas clásicas interiores y exteriores y siete fichas, sin dinero real.
- Motor de apuestas separado del dibujo de la rueda; giro criptográfico con rechazo del extremo módulo, saldos atómicos y liquidación única al recuperar un giro interrumpido.
- Botones grandes y selección confirmada de combinaciones; tapete vertical en móvil y horizontal en pantallas anchas.
- Pruebas de catálogo, partidas completas, orientación, accesibilidad y ruleta en Chromium, Firefox y WebKit; PWA offline y actualización en Chromium.
- PWA `27.0.0`, 191 recursos, actualización explícita y preservación de preferencias anteriores.

## Base v26 conservada

- Se eliminan carrera, experiencia, niveles, trofeos, logros, clasificaciones y desbloqueos.
- Se conserva solo una preferencia local de nombre, sonido y vibración, además de los juegos recientes.
- La portada usa una hoja de estilos propia y deja de cargar la pila histórica de parches.
- Brisca incorpora niveles Casual, Normal y Difícil, además de mesa local para 2–4 personas.
- Se añaden Cinquillo, Pocha, Burro, Charadas y Dibuja.
- Las mesas locales ocultan la mano o la palabra antes de pasar el dispositivo.
- El runtime común aporta baraja española, ajuste de manos, pantalla privada, avisos y preferencias compartidas.

## Arquitectura

- `index.html`, `hub.css` y `casual.js`: descubrimiento y preferencias sin dependencias de la capa histórica.
- `game-core.js` y `game-core.css`: utilidades y patrón visual de los juegos nuevos.
- `ruleta-core.js`: catálogo de apuestas, RNG y saldos sin DOM; `ruleta-casino.js/css/html`: mesa, rueda y controles.
- CSS y JavaScript específicos por juego: reglas, estado y presentación aislados.
- `pwa.js`, `sw.js` y `manifest.webmanifest`: instalación, almacenamiento local y modo offline.
- `scripts/validate.mjs`: contrato estructural, referencias, identidad de cada juego y recursos offline.
- `tests/catalog.spec.js`, `critical.spec.js`, `roulette.spec.js`, `offline.spec.js`: matriz de navegadores; `tests/unit/roulette.test.mjs`: reglas del motor.

Las capas responsive maduras de los juegos anteriores se mantienen donde retirarlas podía alterar reglas o mesas ya estables. La portada y los juegos nuevos no dependen de ellas.

## Desarrollo y QA

Requiere Node.js 20 o superior, pnpm 10 y Python 3 para el servidor estático de Playwright.

```bash
pnpm install --frozen-lockfile
pnpm run test:static
pnpm run test:unit
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm run test:e2e
```

`pnpm run test` ejecuta validación, motor y navegadores. Actions separa validación, Chromium (cinco tamaños), Firefox, WebKit y PWA. Consulta `CAMBIOS-v27.md`, `QA-v27.md` e `INSTALACION.md`; los informes v26 se conservan como histórico.

## Publicación

Publica el contenido de la raíz del proyecto en GitHub Pages. `index.html`, `sw.js` y `manifest.webmanifest` deben quedar directamente en la raíz publicada.

Mus y Dominó siguen pendientes de diseño para v28 o posterior. WebKit automatizado no equivale a una prueba física en Safari/iPhone.
