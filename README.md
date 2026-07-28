# Tute IA — Mobile First + PWA offline · v14

Esta versión transforma el proyecto en una aplicación web instalable, preparada para móviles y capaz de continuar funcionando sin conexión después de la primera carga completa.

## Experiencia móvil

- Diseño específico para pantallas pequeñas, orientación vertical y horizontal.
- Compatibilidad con áreas seguras de iPhone, notch e isla dinámica.
- Cartas, manos, mesa, menús y diálogos adaptados a interacción táctil.
- Reordenación por arrastre, hueco de inserción y desplazamiento automático de la mano al acercarse a los extremos.
- Toque para jugar y arrastre hasta el tapete.
- Pantalla privada reforzada en el modo «pasa el móvil».
- Ocultación automática de la mano al minimizar, cambiar de pestaña o bloquear el dispositivo.
- Bloqueo de pantalla activa durante las partidas cuando el navegador lo permite.

## Aplicación instalable

- Manifest PWA completo, iconos normales y maskable, accesos directos y capturas.
- Instalación en Android desde el navegador.
- Instrucciones integradas para añadirla a la pantalla de inicio en iPhone o iPad.
- Apertura en modo aplicación, sin depender de las barras normales del navegador.
- Opción de pantalla completa.

## Offline y guardado

- Cartas, reglas, tutoriales, interfaces y música ligera precargados por el service worker.
- Página de respaldo cuando no existe conexión.
- Partidas contra IA, multijugador local y mesas multijugador contra IA guardadas automáticamente en IndexedDB.
- Continuación de la última partida desde el menú.
- Exportación e importación de una copia de seguridad en JSON.
- Solicitud opcional de almacenamiento persistente.
- Aviso de nuevas versiones sin eliminar partidas guardadas.

## Música

- Pista ligera de cinco minutos incluida en la instalación offline inicial.
- Pista completa de treinta minutos disponible mediante descarga opcional desde el panel de la aplicación.
- La pista completa no ralentiza la instalación básica.

## Publicación

Sube todo el contenido de esta carpeta a la raíz del repositorio y reemplaza la versión anterior. Tras el despliegue, abre la web una vez con conexión para completar la instalación offline.

La versión de caché es `14.0.0`.
