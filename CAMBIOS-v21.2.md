# Sala Cero v21.2.0 — Formatos móvil/iPhone y ordenador

## Selector de formato

- Selector inicial con dos opciones: **Móvil / iPhone** y **Ordenador**.
- Recomendación automática según tamaño de pantalla y tipo de puntero.
- La elección queda guardada en el navegador.
- Botón flotante para cambiar de formato desde cualquier juego.
- El modo ordenador en un teléfono utiliza un lienzo panorámico; el modo móvil carga la composición vertical dedicada.

## Diseño móvil

- Altura calculada con `visualViewport` para evitar cortes causados por las barras de Safari.
- Respeto de las zonas seguras del notch y de la barra inferior.
- Tute y sus modos locales: mano principal más grande y desplazamiento horizontal controlado.
- Generala: zona de juego y panel de puntuación ajustados a la altura visible.
- Chinchón, Escoba y Culo: controles inferiores y paneles adaptados.
- Póker: seis jugadores visibles, Anton sin asientos superpuestos y controles separados de la mesa.
- «Es un 10 pero...»: pantalla vertical propia, carta protagonista y botón siempre accesible.

## Diseño de ordenador

- Se conserva la distribución panorámica y la información simultánea.
- Mesa de Póker de seis plazas recolocada para dejar libre la figura de Anton.
- «Es un 10 pero...» mantiene la composición de texto lateral y mesa grande.

## PWA y publicación

- Service worker actualizado a `21.2.0`.
- `device-mode-boot.js`, `device-mode.js` y `device-mode.css` incluidos en la caché offline.
- Todos los HTML cargan el selector y la capa de formato.
