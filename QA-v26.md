# QA Sala Cero v26.1.0

## Matriz responsive

Los 27 juegos se prueban en:

- escritorio: `1440×900`;
- tablet táctil: `768×1024`;
- móvil: `390×844`;
- móvil compacto: `360×800`;
- móvil horizontal: `844×390`.

Son **135 combinaciones de juego y viewport**. En cada una se comprueban:

- carga HTML y título;
- errores JavaScript, consola y peticiones fallidas;
- imágenes rotas y recursos HTTP con error;
- desbordamiento horizontal del documento;
- controles visibles fuera del viewport;
- enlace de vuelta a `index.html`.

La portada se prueba también en los cinco proyectos. La suite enumera 205 casos Playwright: 153 comprobaciones activas y 52 omisiones deliberadas porque los flujos completos se ejecutan una sola vez en `390×844`.

## Flujos smoke

- Tute inicia una variante y mantiene la mano completa.
- Generala, Chinchón, Escoba, Culo, Póker y Blackjack abren una partida.
- Brisca difícil reparte tres cartas, abre reglas y conserva la mano al rotar a `844×390`.
- Cinquillo crea cuatro secuencias y muestra la mano completa.
- Pocha abre apuestas, triunfo, mano y marcador para cuatro jugadores.
- Burro muestra la pantalla privada antes de la primera mano.
- Charadas expone siempre Pasar y Acertado.
- Dibuja protege la palabra y abre el canvas táctil.
- Se validan los valores de Brisca y los contratos de reglas de Cinquillo y Pocha.

## Validación estructural

`scripts/validate.mjs` exige:

- 32 páginas HTML y 27 juegos catalogados;
- 27 enlaces e identificadores únicos;
- identidad `data-game` coherente en cada página;
- viewport, versión, runtime común y enlace de inicio;
- referencias locales e IDs sin duplicados;
- ausencia de runtimes y textos visibles de la progresión antigua;
- manifiesto, accesos directos y caché offline coherentes;
- sintaxis válida de todos los scripts clásicos.

Estado de la validación estática de v26.1.0: **32 HTML, 27 juegos, 575 referencias, 188 recursos offline y 0 incidencias**.

## Ejecución

```bash
pnpm install --frozen-lockfile
pnpm run test:static
pnpm run test:e2e
pnpm run test:e2e:smoke
```

GitHub Actions instala Chromium y repite la validación estructural y Playwright en cada push a `main`, pull request o ejecución manual. Si falla, conserva el informe HTML durante 14 días.
