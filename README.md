# Sala Cero v26.0.3

Sala Cero reúne **22 juegos offline** en una sola web, diseñada para móvil, iPhone, teléfono horizontal y ordenador. La v26 añade Brisca, estadísticas comunes a todo el catálogo y una barrera automática de calidad responsive.

## Juegos incluidos

### Mesas clásicas y casino

- Tute
- Brisca
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

## Novedades de la v26

- Brisca completa contra Doña Virtud o en modo local para 2–4 personas.
- Estadísticas globales de sesiones, partidas terminadas, victorias, racha, tiempo, juego favorito, jugadores e historial.
- Diseño responsive revisado en `1440×900`, `390×844`, `360×800` y `844×390`.
- Pruebas Playwright sobre los 22 juegos: errores JavaScript, imágenes rotas, desbordamiento horizontal y controles fuera del viewport.
- GitHub Actions ejecuta la validación estructural y la matriz responsive en cada push y pull request.
- Service worker `26.0.3` con 175 recursos esenciales para jugar sin conexión.

## Desarrollo y QA

Requiere Node.js 20 o superior y pnpm.

```bash
pnpm install
pnpm run test:static
pnpm run test:e2e
```

`pnpm run test` ejecuta ambas capas. Consulta `CAMBIOS-v26.md`, `QA-v26.md` e `INSTALACION.md`.

## Publicación

Publica el contenido de la raíz del proyecto en GitHub Pages. `index.html`, `sw.js` y `manifest.webmanifest` deben quedar directamente en la raíz publicada.
