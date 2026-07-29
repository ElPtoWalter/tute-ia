# Comprobaciones de Sala Cero v18

## Superadas

- Sintaxis validada de todos los archivos JavaScript mediante `node --check`.
- Lógica del perfil ejecutada en un entorno controlado:
  - creación del perfil;
  - registro de partida de Generala;
  - actualización de estadísticas;
  - desbloqueo de logros;
  - progreso diario;
  - cambio de nombre y emblema.
- Los siete documentos HTML no contienen identificadores duplicados.
- Todas las referencias locales de HTML existen.
- Los 75 recursos declarados en la caché offline existen.
- Todos los estilos CSS se analizaron sin errores de sintaxis.
- El ZIP fue generado desde la carpeta completa, conservando cartas, audio, cubilete y PWA.

## Pendiente tras publicar

El navegador disponible en el entorno de construcción bloqueó por política administrativa la navegación a direcciones locales y archivos `file://`. Por ello, la comprobación visual final y la instalación real del service worker deben realizarse una vez publicada la versión en GitHub Pages.
