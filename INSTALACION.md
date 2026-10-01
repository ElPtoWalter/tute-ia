# Sala Cero v27.0.0 — Instalación y publicación

## GitHub Pages

Publica todos los archivos del proyecto en la raíz del repositorio. No subas una carpeta contenedora: `index.html`, `sw.js` y `manifest.webmanifest` deben quedar directamente en la raíz publicada.

La web no necesita API, base de datos ni proceso de compilación. Las preferencias, partidas compatibles y juegos recientes se guardan solo en el navegador.

## Actualización desde una versión anterior

1. Revisa la PR con todos los jobs de `QA Sala Cero` en verde antes de llevarla a `main`.
2. Publica los archivos de v27.0.0 en la raíz mediante GitHub Pages, incluidas las carpetas `assets`.
3. Abre con conexión. Si aparece «Nueva versión disponible», termina el turno y pulsa «Actualizar».
4. Espera a que `APP` muestre «Lista» y comprueba la versión `27.0.0`. Después prueba a abrir la Ruleta de Antón sin conexión.

El service worker `27.0.0` prepara 191 recursos y elimina las cachés `tute-ia-*` anteriores al activarse. La primera instalación no recarga el juego. Las actualizaciones posteriores esperan al usuario. El trabajador v26 publicado ya usaba activación automática: la transición desde aquel código no puede modificar retroactivamente su comportamiento. Se conserva el almacenamiento local, incluido el nombre, las preferencias y el saldo de ruleta.

## Instalación en el dispositivo

- Android/Chrome: usa el botón `APP` y después **Instalar**.
- iPhone/iPad: abre en Safari, pulsa Compartir y elige **Añadir a pantalla de inicio**.
- Escritorio compatible: usa el botón de instalación del navegador o el panel `APP`.

Charadas puede solicitar permiso de orientación en iOS. Es opcional: Pasar y Acertado funcionan siempre. La vibración también es opcional y se ignora de forma segura en dispositivos no compatibles.

## Validación antes de publicar

```bash
pnpm install --frozen-lockfile
pnpm run test
```

El workflow `QA Sala Cero` repite estas pruebas en GitHub. No publiques una revisión cuyo workflow esté en rojo.

## Recuperación

Si sigue mostrando una versión antigua, cierra las pestañas de Sala Cero y abre con conexión; revisa `APP` y aplica «Actualizar». No borres tus partidas como primer paso. Exporta una copia antes de una limpieza voluntaria de datos. El navegador puede desalojar cachés por falta de espacio: no se garantiza almacenamiento offline permanente.

## Comprobación física pendiente

- iPhone/Safari: instalación, safe areas, giro portrait–landscape–portrait, sonidos tras pulsar, tapete sin cortes y reanudación tras bloquear la pantalla.
- Android/Chrome: instalación, vibración opcional, apuestas y giro offline, actualización desde la aplicación instalada.
- iPad/Safari: rueda, teclado externo, selección de combinaciones, Dibuja con lápiz y persistencia al rotar.

La matriz de Playwright comprueba WebKit y Firefox en Linux. No certifica esos dispositivos ni Safari físico.
