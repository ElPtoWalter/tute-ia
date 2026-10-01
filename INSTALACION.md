# Sala Cero v26.1.2 — Instalación y publicación

## GitHub Pages

Publica todos los archivos del proyecto en la raíz del repositorio. No subas una carpeta contenedora: `index.html`, `sw.js` y `manifest.webmanifest` deben quedar directamente en la raíz publicada.

La web no necesita API, base de datos ni proceso de compilación. Las preferencias, partidas compatibles y juegos recientes se guardan solo en el navegador.

## Actualización desde una versión anterior

1. Publica todos los archivos de v26.1.2, incluidas las carpetas `assets`, `scripts` y `tests`.
2. Abre la web con conexión y realiza una recarga completa.
3. Espera a que el control `APP` indique que la versión offline está preparada.
4. Cierra pestañas antiguas de Sala Cero y vuelve a abrir la aplicación instalada.

El service worker `26.1.2` elimina las cachés de versiones anteriores y prepara 187 recursos esenciales. El nombre antiguo puede migrarse como preferencia; la carrera y sus estadísticas no se importan.

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

Si un dispositivo conserva una interfaz anterior después de la publicación, abre el panel `APP`, borra los datos locales de Sala Cero y recarga con conexión. Esta acción elimina preferencias y partidas guardadas de ese dispositivo.
