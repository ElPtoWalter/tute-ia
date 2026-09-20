# Sala Cero v24.0 — Reforma responsive y de acceso

## Experiencia móvil

- Eliminado el selector manual de dispositivo y la posibilidad de dejar un móvil atrapado en el formato de escritorio.
- Nueva capa responsive común para las 27 páginas, con tipografía legible, controles táctiles, zonas seguras de iPhone y eliminación de desbordamientos laterales.
- Mesa de Tute reconstruida para encajar en 390 × 844 px: rival, tapete, acciones, jugador y mano ocupan zonas estables sin solaparse.
- Modales de variante y configuración convertidos en hojas móviles desplazables, sin doble scroll de la página.
- Mejoras específicas para Generala, juegos de salón, Póker, Blackjack, Impostor y los doce juegos de grupo.

## Portada y navegación

- Portada más compacta y orientada a empezar a jugar.
- Buscador instantáneo para los 21 juegos.
- Filtros por Todos, Cartas, Party, Palabras y Dados.
- Navegación inferior móvil a Inicio, Juegos, Carrera y Perfil.
- Tarjetas más ligeras y contenido no visible diferido para reducir trabajo de renderizado.

## Acceso y datos

- Ya no se exige crear o seleccionar una cuenta local antes de explorar y jugar.
- El perfil local sigue disponible de forma opcional y los datos de invitado permanecen aislados en el navegador.
- Las imágenes no críticas usan carga diferida y decodificación asíncrona.

## PWA y mantenimiento

- Service worker actualizado a `24.0.1`.
- Añadidos `v24-responsive.css` y `v24-ui.js` al shell offline.
- Corregida la recuperación offline para todas las páginas de juego, no solo para la portada.
- Versionados los recursos de las 27 páginas para evitar mezclas con cachés v23.
- La precarga offline limita la concurrencia y la caché respeta la versión de CSS/JS, evitando 169 descargas simultáneas y estilos antiguos en la primera recarga.
