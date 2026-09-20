# QA Sala Cero v23.0

## Comprobaciones automáticas realizadas

- 21 tarjetas de juego detectadas en la portada.
- 12 nuevas páginas de juego con `gameRoot`, ayuda y motor JavaScript asociado.
- Todos los enlaces, scripts, hojas de estilo e imágenes locales referenciados por los HTML existen en el paquete.
- Los 167 recursos declarados en la caché principal del service worker existen.
- Todos los accesos rápidos del manifest apuntan a archivos existentes.
- Sintaxis validada con `node --check` para todos los JavaScript del proyecto.
- Estructura HTML parseada y comprobación de delimitadores CSS realizada.
- Anclas internas de navegación de la portada verificadas.
- `manifest.webmanifest` validado como JSON.

## Riesgos eliminados

- No hay dependencias de API para los nuevos juegos.
- La información secreta utiliza pantallas de entrega del móvil antes de mostrar manos, dados o respuestas.
- La Pirámide está limitada a 2–6 personas para no sobrepasar la baraja española de 40 cartas durante la fase principal.
- La caché pasa a v23.0.0, por lo que una instalación previa de v22 no debe reutilizar el shell antiguo.

## Comprobación recomendada tras publicar

Abrir la portada una vez con conexión, recargar y entrar al menos en un juego clásico y uno nuevo. Después activar modo avión y comprobar que ambos vuelven a abrir desde la misma instalación.
