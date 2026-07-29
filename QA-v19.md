# Comprobaciones de Sala Cero v19

## Superadas

- Sintaxis validada de todos los archivos JavaScript mediante `node --check`.
- Flujo completo de carrera ejecutado en un entorno controlado:
  - cuatro encuentros del Circuito de Iniciación;
  - desbloqueo de Liga de Generala y Copa del Tute;
  - cinco jornadas de liga con todos los participantes disputando cinco partidos;
  - tres rondas de Copa de Maestros;
  - desbloqueo del Campeonato de Sala Cero;
  - concesión de trofeos y recompensas;
  - equipamiento de cosméticos desbloqueados.
- Integración probada entre `club.js` y `career.js`: una partida actualiza perfil, experiencia, estadísticas y carrera en una sola operación.
- Los ocho documentos HTML no contienen identificadores duplicados.
- Todas las referencias locales de HTML existen.
- Los 78 recursos declarados en la caché offline existen.
- Las llaves de todos los archivos CSS están equilibradas.
- El ZIP se comprobó después de generarlo.

## Limitación del entorno

Chromium no consiguió iniciar correctamente en el entorno de construcción por errores del servicio D-Bus. Por ello no se afirma una prueba visual automatizada completa ni una instalación real del service worker. La sintaxis, los recursos, el estado de carrera y la integración de los motores sí fueron comprobados directamente.
