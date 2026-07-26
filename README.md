# Tute IA — Mesa Cero · v7 final visual

Versión cerrada del núcleo visual y físico del juego de tute habanero contra IA.

## Qué queda terminado

### Baraja original

- 40 cartas SVG creadas individualmente.
- Cuatro palos con símbolos, paletas y detalles propios.
- Ases especiales y figuras completas de sota, caballo y rey.
- Pintas tradicionales en los marcos para distinguir los palos.
- Reverso exclusivo de Tute IA.
- Sin fotografías recortadas ni reproducciones literales de una baraja comercial.

### Mano manual

- La mano del jugador no se ordena automáticamente.
- Las cartas conservan el orden de reparto y de robo.
- Se pueden reorganizar libremente arrastrando con ratón.
- La misma reorganización funciona mediante gesto táctil en móvil.
- Las cartas nuevas se añaden al extremo derecho de la mano.

### Movimiento físico

- Reparto alterno carta por carta.
- Giro de la carta al llegar a la mano del jugador.
- La IA revela su jugada durante el vuelo hacia la mesa.
- Robo manual tocando la baceta o el botón de robo.
- Abanico natural para ambas manos.
- Posición y giro ligeramente distintos en cada carta jugada.
- Las bazas vuelan al montón del ganador.
- Montones de bazas visibles con contador.
- Baceta formada por capas que disminuyen según quedan menos cartas.
- Transiciones FLIP al reorganizar, jugar o recibir cartas.

### Juego

- Tute habanero de dos jugadores.
- Cantes de 20, 40 y tute.
- Cambio del pinte mediante siete o dos.
- Diez de últimas.
- Tres niveles de IA.
- Marcador por manos.
- Diseño responsive para ordenador y móvil.
- PWA y funcionamiento sin conexión tras la primera carga.

## Publicación en GitHub Pages

1. Descomprime el ZIP.
2. Sube todo el contenido a la raíz del repositorio `tute-ia`.
3. Reemplaza los archivos antiguos.
4. Confirma que `assets/cards/` contiene 41 SVG.
5. Haz el commit.
6. Espera unos minutos y recarga la web con `Ctrl + Shift + R`.

No hace falta una carpeta `.github`.

## Estructura principal

```text
index.html
styles.css
app.js
sw.js
manifest.webmanifest
assets/
  cards/
    40 caras SVG
    back.svg
```

## Siguiente fase recomendada

Con el apartado visual y físico cerrado, el siguiente bloque lógico es el modo online: salas privadas, sincronización de turnos, reconexión y prevención de trampas.
