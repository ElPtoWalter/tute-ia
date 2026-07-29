# Comprobaciones de Sala Cero v20

## Sintaxis y estructura

- Todos los archivos JavaScript superan `node --check`.
- El manifiesto PWA es JSON válido.
- Las doce hojas CSS se han analizado sin errores de sintaxis.
- Los diez HTML no contienen identificadores duplicados.
- Todos los enlaces, scripts, hojas de estilo, imágenes y audios locales referenciados existen.
- Los identificadores utilizados por `chinchon.js` y `escoba.js` están presentes en sus respectivos HTML.
- Los 83 recursos esenciales declarados en el service worker existen.
- Están presentes los 40 naipes y el reverso.

## Motor de Chinchón

- Baraja de 40 cartas.
- Detección de grupos de tres y cuatro cartas.
- Detección de escaleras de tres a siete cartas.
- Detección de Chinchón perfecto de siete cartas.
- Cálculo de puntos sueltos y selección de combinaciones no solapadas.
- Colocación de cartas sueltas en grupos y extremos de escaleras.
- Cierre limpio y límite máximo de cinco puntos sueltos.
- Mil manos aleatorias analizadas sin puntos negativos, duplicación de cartas en combinaciones ni resultados fuera de rango.

## Motor de Escoba

- Baraja de 40 cartas.
- Valores comprobados: sota 8, caballo 9 y rey 10.
- Reconocimiento del reparto inicial de 15 como una escoba y de 30 como dos.
- Generación de capturas de una o varias cartas.
- Mil escenarios aleatorios comprobados: todas las combinaciones propuestas suman exactamente quince y no repiten cartas.
- Recuento de mayorías sin conceder punto cuando existe empate.
- Entrega de las cartas restantes al último jugador que realizó una captura.

## Club y Carrera

- Registro independiente de partidas, victorias y mejores resultados de Chinchón y Escoba.
- Registro de Chinchón especial y partidas destacadas de Escoba.
- Migración de datos anteriores conservando las claves de almacenamiento de v18/v19.
- Creación y avance de la Copa de Juegos de Salón.
- Enrutamiento de encuentros de Carrera hacia `chinchon.html` y `escoba.html`.
- Consumo de resultados, avance de fase y eliminación del encuentro pendiente.
- Detección de los cuatro juegos en el aviso activo de competición.

## Navegación y PWA

- Portada, menús de los cuatro juegos, Carrera, Tute local y Tute multijugador enlazados correctamente.
- Tute local y multijugador regresan a `tute.html`.
- Fallback offline disponible para Chinchón y Escoba.
- Atajos PWA incluidos para los cuatro juegos y la Carrera.

## Limitación del entorno

Se intentó ejecutar Chromium headless con distintas configuraciones, pero el proceso no completó el renderizado debido a errores internos de D-Bus y del proceso zygote del contenedor. Por esa razón no se afirma una validación visual automatizada completa. Sí se han ejecutado directamente las validaciones de sintaxis, estructura, recursos, reglas, aleatoriedad e integración descritas arriba.
