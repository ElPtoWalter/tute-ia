# Sala Cero v22.0 — Optimización integral

Esta versión se centra en que toda la sala transmita una impresión coherente, cuidada y cómoda tanto en ordenador como en móvil/iPhone.

## Cambios principales

- Nueva capa visual común `polish-v22.css` aplicada al menú, Carrera y los nueve juegos.
- Jerarquía tipográfica y contraste revisados; se eliminan tamaños móviles de 4–8 px que resultaban difíciles de leer.
- Controles táctiles ampliados, estados de foco claros, mejor respuesta al pulsar y botones desactivados más comprensibles.
- Cabeceras unificadas con navegación desplazable en pantallas estrechas, sin comprimir los botones.
- Adaptación específica de las mesas de Tute, Generala, Chinchón, Escoba, Culo, Póker y Blackjack.
- Es un 10 optimizado para mostrar la carta como protagonista en vertical.
- Impostor simplificado para que cada pantalla tenga una acción principal clara.
- Diálogos, reglas, configuraciones y resultados adaptados a la altura real del dispositivo y a las zonas seguras de iPhone.
- Mejor soporte para teclado, lectores de pantalla, movimiento reducido y navegación mediante foco.
- Imágenes secundarias de la portada con carga diferida para acelerar la primera impresión.
- Service worker actualizado a v22.0.0: la instalación offline ya no falla por completo si un recurso aislado no puede descargarse.
- Eliminado el PNG duplicado del cubilete; se conserva la versión WebP de menor peso.
- Versiones visibles de portada, Carrera, Tute y panel PWA unificadas en v22.0.
- Preferencia anterior de formato móvil/ordenador conservada automáticamente al actualizar.

## Compatibilidad

- Ordenador: diseño panorámico con información simultánea y paneles laterales.
- Móvil/iPhone: interfaz vertical, controles de al menos 44–48 px y ausencia de desbordamiento horizontal.
- Funcionamiento offline y partidas guardadas conservados.
