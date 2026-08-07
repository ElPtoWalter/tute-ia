# Sala Cero v22.0.0 — Rebuild

La capa de producto se ha rehecho desde cero. Los motores de juego se conservan, pero se elimina la arquitectura de cuenta/progresión y se unifica el responsive.

## Eliminado
- Inicio de sesión/perfiles.
- Nombre global de usuario.
- XP, niveles, logros, retos, trofeos y carrera.
- Selector manual PC/móvil.
- Panel PWA complejo y copias de seguridad globales.
- Capas CSS/JS duplicadas del selector de dispositivo y recursos heredados no usados.

## Nuevo
- Portada totalmente nueva y directa.
- Responsive automático.
- Safe-area real para iPhone.
- Controles de 48–56 px y formularios a 16 px para evitar zoom de Safari.
- Modales móviles tipo bottom sheet/pantalla completa.
- Menos decoración y más espacio para mesa, cartas, dados y acciones.
- Service worker más pequeño y caché coherente con v22.

Los nombres que siguen existiendo dentro de modos multijugador son nombres de jugadores de esa partida, no perfiles ni sesiones.
