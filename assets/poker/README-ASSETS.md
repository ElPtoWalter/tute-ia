# Recursos personalizados de Póker

La versión actual usa cartas, fichas y marcadores dibujados por CSS/SVG. Para sustituirlos por los recursos definitivos:

- Crupier: `assets/poker/anton-crupier.webp`
- Reverso: `assets/poker/card-back.webp`
- Cartas: `assets/poker/cards/{RANGO}-{PALO}.webp`
  - Rangos: `A`, `2` ... `10`, `J`, `Q`, `K`
  - Palos: `corazones`, `diamantes`, `treboles`, `picas`
  - Ejemplos: `A-picas.webp`, `10-corazones.webp`, `Q-diamantes.webp`
- Fichas: `assets/poker/chips/1.webp`, `5.webp`, `10.webp`, `25.webp`, `50.webp`, `100.webp`, `500.webp`
- Marcadores: `assets/poker/markers/dealer.webp`, `ciega-pequena.webp`, `ciega-grande.webp`

Después se activa el modo de imágenes en `poker-assets.js`.
