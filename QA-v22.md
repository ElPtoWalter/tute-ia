# QA Sala Cero v22.0

## Validaciones automáticas superadas

- 15 documentos HTML revisados.
- 25 archivos JavaScript comprobados con `node --check`.
- 22 hojas CSS analizadas sin errores de sintaxis.
- Referencias locales de HTML, manifest y service worker comprobadas.
- IDs duplicados: ninguno.
- Recursos ausentes: ninguno.
- Manifest PWA válido.
- ZIP final validado tras su creación.

## Validación visual

Se revisaron vistas de bienvenida y mesas en:

- 1440 × 1000 px, formato ordenador.
- 390 × 844 px, formato móvil/iPhone.

Páginas revisadas: portada, Tute, Generala, Chinchón, Escoba, Culo / Presidente, Póker, Blackjack, Impostor y Es un 10 pero…

Resultado de la comprobación estática:

- Sin desbordamiento horizontal en las vistas revisadas.
- Cabeceras accesibles y controles táctiles legibles.
- Mesas principales contenidas dentro del ancho disponible.
- Diálogos limitados a la altura visible y con desplazamiento interno.
- Póker y Blackjack con paneles de acciones estables en móvil.
- Marcadores móviles plegables conservados.

## Comprobaciones recomendadas tras subir a GitHub Pages

1. Abrir una vez la web con conexión para que se actualice el service worker a v22.0.0.
2. Recargar la página si el navegador conserva la versión anterior.
3. Iniciar una partida rápida de cada juego y comprobar sonido, guardado y continuación.
4. Probar especialmente Safari en iPhone con la barra del navegador visible y oculta.
