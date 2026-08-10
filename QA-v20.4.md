# Comprobaciones de Sala Cero v20.4

## Código y estructura

- Todos los archivos JavaScript superan `node --check`.
- Los 12 documentos HTML se analizaron sin identificadores duplicados.
- No se detectaron enlaces internos ni recursos locales inexistentes.
- Las 17 hojas de estilo se analizaron sin errores de sintaxis CSS.
- Los 102 recursos declarados por el service worker existen.

## Motor de Póker

- Baraja de 52 cartas únicas.
- Comprobación individual de las nueve categorías de mano.
- Escalera baja A-2-3-4-5 validada.
- 1.000 evaluaciones aleatorias de siete cartas.
- Botes principal y secundarios probados con un caso explícito.
- 5.000 escenarios aleatorios comprobando que el total repartido coincide con el bote.
- Rotación de dealer y ciegas, incluido el modo de dos jugadores.
- Fases preflop, flop, turn, river y showdown.
- Bloqueo de reapertura ante un all-in corto inferior a la subida mínima.

## Interfaz real ejecutada

Se ejecutó la interfaz del Póker en Chromium mediante un documento autocontenido, debido a que el entorno bloquea por política administrativa la navegación directa a `file://` y `localhost`.

- Renderizado de los cuatro asientos.
- Avance interactivo desde preflop hasta river con cinco cartas comunitarias.
- Modo local de cuatro jugadores: pantalla privada visible, acciones bloqueadas antes de revelar y habilitadas después.
- Dos cartas privadas visibles tras la confirmación del jugador.
- Pantalla móvil 390 × 844 sin desbordamiento horizontal.
- Pantalla de escritorio 1440 × 900 sin desbordamiento horizontal.
- Anton y el asiento superior no se solapan.
- No se registraron errores JavaScript en la ejecución final.

## Limitación del entorno

No fue posible probar la instalación real de la PWA ni la navegación directa servida por HTTP porque Chromium bloqueó las URL locales por política administrativa. La lista de caché y todos sus recursos sí se verificaron estáticamente. La instalación offline completa debe confirmarse una vez publicada mediante HTTPS.
