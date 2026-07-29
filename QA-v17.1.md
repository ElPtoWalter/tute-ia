# QA — Sala Cero v17.2

## Pruebas funcionales realizadas

- Doble pulsación rápida sobre el cubilete: genera una sola tirada (`1 / 3`).
- Dado guardado: mantiene su valor en la segunda tirada.
- Guardar y volver al menú: habilita «Continuar» y recupera la tirada `2 / 3`.
- Turno de IA: realiza sus tiradas, anota una categoría y devuelve el turno al jugador.
- Multijugador local a tres: muestra la pantalla privada, revela el turno y permite tirar.
- Cinco dados presentes y operativos.
- Planilla completa con once categorías y total.

## Pruebas de interfaz

- Escritorio 1680 × 950: sin desbordamiento horizontal.
- Móvil 390 × 844: sin desbordamiento antes ni después de tirar.
- Cabecera móvil situada en la parte superior.
- Cubilete, dados, categorías y botón de tirada visibles.
- Marcador móvil plegable.

## Validaciones estáticas

- Sintaxis válida en todos los archivos JavaScript.
- Ninguna referencia HTML apunta a un archivo inexistente.
- Los 71 recursos esenciales de la caché PWA existen.
- `app.js`, `local.js`, `multi.js`, `tute.html`, `styles.css`, `mobile.css`, `local.css` y `multi.css` coinciden byte a byte con la v17.

## Limitación de entorno

La instalación real del service worker requiere publicar la web mediante HTTPS. Se ha validado la lista completa de recursos y la sintaxis, pero el botón de instalación PWA debe comprobarse una vez publicada en GitHub Pages.
