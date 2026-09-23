# Sala Cero v25.0 — Instalación

Publica todos los archivos del paquete en la raíz del repositorio de GitHub Pages. No subas la carpeta contenedora del ZIP: `index.html` debe quedar directamente en la raíz.

Tras publicar, abre la web con conexión y realiza una recarga completa. El service worker `25.0.9` reemplazará la caché anterior y descargará los recursos de los 21 juegos.

Los doce juegos nuevos no usan APIs externas y funcionan localmente una vez cacheados.

En móvil conviene cerrar cualquier pestaña antigua de Sala Cero después de la primera recarga para que todas las vistas usen la misma versión del shell.
