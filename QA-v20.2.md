# QA — Sala Cero v20.2

## Sesiones y almacenamiento

- Creación de dos perfiles independientes: superada.
- Acceso con PIN correcto y rechazo de PIN incorrecto: superado.
- Perfil sin PIN y entrada directa: superado.
- Separación de estadísticas de Tute: superada.
- Separación de Carrera de Sala Cero: superada.
- Separación de datos del Club, experiencia e historial: superada.
- Cambio de nombre y emblema sincronizado entre cuenta y club: superado.
- Migración de un perfil v20.1 con experiencia y estadísticas: superada.

## Interfaz

- Pantalla de creación renderizada a 1440 × 1000: superada.
- Selector con varios usuarios, nivel, XP e indicador de PIN: superado.
- Pantalla de creación a 390 × 844: sin desbordamiento horizontal; superada.
- Ancho de documento móvil: 390 px para un viewport de 390 px.

## Integridad

- Sintaxis de los 15 JavaScript: correcta.
- 11 HTML revisados, sin identificadores duplicados.
- Enlaces y recursos locales de todos los HTML: existentes.
- 90 recursos esenciales de la PWA: existentes.
- Manifest y service worker actualizados a 20.2.0.

## Límite de la comprobación

El navegador del entorno bloquea por política administrativa la navegación a servidores locales. Las pantallas de acceso se renderizaron en Chromium mediante un documento aislado con el CSS y JavaScript reales; el flujo de datos se verificó además con pruebas de integración. La navegación completa sobre GitHub Pages deberá confirmarse tras publicar.
