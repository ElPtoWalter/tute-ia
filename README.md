# Sala Cero v26.1.2

Sala Cero es una colección de **27 juegos casuales** para abrir y jugar sin registro. La experiencia se ha reducido a tres pasos: **abrir → elegir juego → jugar**. Está pensada para móvil, tablet, teléfono horizontal y escritorio, y queda disponible sin conexión después de la primera carga.

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

## Qué cambia en v26.1

- Se eliminan carrera, experiencia, niveles, trofeos, logros, clasificaciones y desbloqueos.
- Se conserva solo una preferencia local de nombre, sonido y vibración, además de los juegos recientes.
- La portada usa una hoja de estilos propia y deja de cargar la pila histórica de parches.
- Brisca incorpora niveles Casual, Normal y Difícil, además de mesa local para 2–4 personas.
- Se añaden Cinquillo, Pocha, Burro, Charadas y Dibuja.
- Las mesas locales ocultan la mano o la palabra antes de pasar el dispositivo.
- El runtime común aporta baraja española, ajuste de manos, pantalla privada, avisos y preferencias compartidas.
- La PWA usa la caché `26.1.2` y precarga 187 recursos locales.

## Arquitectura

- `index.html`, `hub.css` y `casual.js`: descubrimiento y preferencias sin dependencias de la capa histórica.
- `game-core.js` y `game-core.css`: utilidades y patrón visual de los juegos nuevos.
- CSS y JavaScript específicos por juego: reglas, estado y presentación aislados.
- `pwa.js`, `sw.js` y `manifest.webmanifest`: instalación, almacenamiento local y modo offline.
- `scripts/validate.mjs`: contrato estructural, referencias, identidad de cada juego y recursos offline.
- `tests/catalog.spec.js`: pruebas Playwright en cinco viewports y flujos smoke.

Las capas responsive maduras de los juegos anteriores se mantienen donde retirarlas podía alterar reglas o mesas ya estables. La portada y los juegos nuevos no dependen de ellas.

## Desarrollo y QA

Requiere Node.js 20 o superior, pnpm 10 y Python 3 para el servidor estático de Playwright.

```bash
pnpm install --frozen-lockfile
pnpm run test:static
pnpm run test:e2e
```

`pnpm run test` ejecuta las dos capas. La misma batería se repite en GitHub Actions. Consulta `CAMBIOS-v26.md`, `QA-v26.md` e `INSTALACION.md`.

## Publicación

Publica el contenido de la raíz del proyecto en GitHub Pages. `index.html`, `sw.js` y `manifest.webmanifest` deben quedar directamente en la raíz publicada.

Mus y Dominó no forman parte de esta versión. Son candidatos para v27, después de consolidar accesibilidad, pruebas de partidas completas y una reducción gradual de las capas CSS heredadas.
