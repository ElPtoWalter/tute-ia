# Sala Cero v27 — Ruleta de Antón + robustez

Base publicada: `effbc4f644fb413ae879e4fae35c573a8df5a695` (v26.1.3). Nueva versión: `27.0.0`. No se sustituye la base ni se cambian las reglas de los juegos anteriores sin un fallo demostrado.

## Juego 28

`ruleta-casino.html/js/css`, motor `ruleta-core.js`. Antón lleva la banca; reutiliza su retrato y las siete fichas existentes. Ruleta del Caos conserva su identidad y funcionamiento.

- Ruleta europea con orden reglamentario, un cero, 18 rojos y 18 negros.
- Pleno 35:1; caballo 17:1; calle/trío 11:1; cuadro/primeros cuatro 8:1; seisena 5:1; docenas/columnas 2:1; simples 1:1. Siempre se devuelve también la apuesta ganadora. Cero pierde todas las externas; sin partage/prison.
- Fichas 1, 5, 10, 25, 50, 100 y 500. Saldo inicial 100/250/500/1000 o entero personalizado 1–100000.
- Solo y mesa local 2–6, saldos independientes, confirmación por turno y pantalla privada al pasar el dispositivo.
- Borrar, deshacer, repetir la distribución anterior y doblar de manera atómica. Resultado inline e historial de 20 giros; no recomendaciones de números calientes/fríos.
- Estados BETTING/SPINNING/RESULT; ningún cambio de apuestas mientras gira. Resultado fijado antes de animar; bola y rueda terminan en la misma casilla.
- `crypto.getRandomValues`, muestreo por rechazo; fallback de Math.random si no hay criptografía. Sin ajuste al saldo ni al historial.
- Persistencia local validada. Giro interrumpido se liquida una sola vez al recuperar; datos corruptos no bloquean la apertura de una mesa nueva.
- Sonido y vibración opcionales respetan preferencias compartidas. Animación con transformaciones, finalización al ocultar pestaña y movimiento reducido.

## Presentación y accesibilidad

Tapete horizontal en pantallas anchas, vertical en móvil; rueda desplegable en pantallas pequeñas. Plenos directos y combinaciones con previsualización/confirmación mediante botones grandes. Teclado, foco visible, etiquetas de apuesta/premio, colores acompañados por nombres/números, modales y avisos accesibles. Desplazamiento vertical permitido; no se intenta encajar toda la mesa a costa de hacer minúsculas las apuestas.

## Integración y PWA

Catálogo de 28, filtro Casino, búsqueda, juego al azar y recientes mediante el runtime común existente. Versiones de recursos y cachés `27.0.0`, precarga de 191 recursos. Iconos, scope e identidad de instalación conservados. Actualización esperando al usuario; primera instalación no recarga la página. Caché de CSS/JS respeta la versión solicitada.

## Limpieza incremental

QA demostró que el mínimo de separación de 18 px desbordaba manos de 20 cartas de Cinquillo: el paso ahora se calcula a partir del ancho disponible, sin alterar las cartas ni sus reglas. El subtítulo largo de Chinchón se adapta en la hoja responsive existente para corregir los 29 px de desbordamiento en Firefox/WebKit.

El panel PWA exporta/importa también claves `salaCero*` (antes solo `tute*`), por lo que el nuevo saldo y las preferencias entran en la copia. El test comprueba que claves de otra web quedan fuera. El botón Girar permanece visible en una franja inferior, con espacio reservado para no ocultar contenido.

Se retira `.pass-screen[hidden]` redundante: `[hidden]` ya tiene `display:none !important` en la misma hoja. Se retiran tres selectores `html[data-career-felt]` de `salon-games.css`, sin consumidores HTML/JS tras retirar Carrera en v26 (búsqueda del repositorio). El flujo privado de Burro y ruleta permanece cubierto por QA. No se crea `v27-fix.css`, ni se borran motores, capas o recursos históricos basándose solo en que parezcan antiguos.

La ruleta añade una hoja propia y usa únicamente `game-core.css` y `pwa.css`; la portada sigue usando `hub.css`. La pila antigua (styles/mobile/sala-cero-v22/polish/v24/v25, según juego) se conserva para una futura retirada por módulo con comparación visual y partidas completas. No se afirma que todos sus selectores sean necesarios ni que los no usados en una sola pantalla sean eliminables.

## Verificación y límites

Ver `QA-v27.md` para resultados y enlaces. La revisión no se fusiona a main con fallos pendientes. WebKit automatizado no sustituye pruebas físicas en Safari. No se añaden Mus, Dominó, pagos, cuentas, carrera, XP, logros ni cambios de reglas no relacionados.
