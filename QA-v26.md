# QA Sala Cero v26.0.1

## Matriz responsive

Los 22 juegos se comprueban en:

- Escritorio: `1440×900`
- Móvil: `390×844`
- Móvil compacto: `360×800`
- Móvil horizontal: `844×390`

Total: **88 combinaciones de página y viewport**.

En cada combinación se revisan carga, errores JavaScript, imágenes rotas, desbordamiento horizontal y controles visibles fuera del viewport. La comprobación manual automatizada de la v26 terminó con 88/88 combinaciones limpias y sin errores de consola.

## Flujos smoke

- Brisca reparte tres cartas, muestra el triunfo y conserva la mano completa.
- La mano de Doña Virtud permanece privada durante su turno.
- Tute inicia la variante clásica.
- Generala, Chinchón y Blackjack abren una mesa individual.
- El catálogo de estadísticas contiene los 22 juegos y las reglas numéricas de Brisca se validan.

## Validación estructural

- 28 páginas HTML.
- 22 juegos catalogados.
- 656 referencias locales comprobadas.
- 175 recursos esenciales del service worker.
- 0 archivos ausentes.
- 0 recursos offline ausentes.
- 0 IDs duplicados.

## Ejecución

```bash
pnpm install
pnpm run test:static
pnpm run test:e2e
```

GitHub Actions repite estas pruebas en cada push a `main`, en cada pull request y bajo ejecución manual.
