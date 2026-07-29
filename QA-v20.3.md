# QA — Sala Cero v20.3

## Validaciones automáticas

- Sintaxis comprobada en todos los archivos JavaScript mediante Node.js.
- 16 hojas CSS analizadas con `tinycss2`: sin errores de parseo.
- 11 documentos HTML revisados: sin identificadores duplicados.
- Todos los enlaces locales de HTML apuntan a archivos existentes.
- Los 94 recursos principales declarados por el service worker existen.
- Caché y versión PWA actualizadas a `20.3.0`.

## Pruebas de diseño adaptable

Se renderizaron las páginas principales en estos anchos:

- 320 × 844 px.
- 360 × 844 px.
- 390 × 844 px.
- 430 × 844 px.
- 768 × 844 px.

Páginas comprobadas:

- Portada y perfiles.
- Carrera.
- Tute y sus mesas local/múltiple.
- Generala.
- Chinchón.
- Escoba de 15.
- Culo / Presidente.

Resultado: ninguna de las páginas produjo desplazamiento horizontal accidental.

## Estructuras activas revisadas

Se forzaron estados de mesa con manos y controles visibles para comprobar la geometría móvil de:

- Tute individual.
- Tute local.
- Tute contra varias IA.
- Generala con los cinco dados y once categorías.
- Chinchón con siete cartas.
- Escoba con cartas en mesa y mano.
- Culo con una mano larga.

Estas pruebas validan la distribución visual y el tamaño de los controles. Los motores y las reglas de los juegos no se han reescrito en esta versión.

## Limitación

La prueba automática no reproduce todos los gestos táctiles físicos de un teléfono real. Conviene realizar una partida corta de cada juego después de publicarla, especialmente en Safari de iPhone y Chrome de Android.
