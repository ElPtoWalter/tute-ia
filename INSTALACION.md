# Sala Cero v26.0.2 — Instalación

Publica todos los archivos del proyecto en la raíz del repositorio de GitHub Pages. No subas una carpeta contenedora: `index.html` debe quedar directamente en la raíz.

Después de publicar, abre la web con conexión y realiza una recarga completa. El service worker `26.0.2` reemplazará las cachés anteriores y preparará los 175 recursos esenciales de los 22 juegos.

La Brisca, las estadísticas y los juegos funcionan sin APIs externas. Toda la información de perfil y actividad se conserva localmente en el navegador.

Para validar antes de publicar:

```bash
pnpm install
pnpm run test
```

En móvil conviene cerrar cualquier pestaña antigua de Sala Cero después de la primera recarga para que todas las vistas adopten la nueva caché.
