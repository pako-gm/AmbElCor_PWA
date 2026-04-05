# Paleta de Colores — Amb el Cor

## Primario · Teal / Turquesa

| Variable          | Hex       | Uso                          |
|-------------------|-----------|------------------------------|
| `--primary`       | `#30BAAA` | Color principal (botones, links, logo, tags) |
| `--primary-dark`  | `#259990` | Hover de botones primarios   |
| `--primary-darker`| `#1A7A6D` | Estados activos / pressed    |
| `--primary-light` | `#E0F5F3` | Fondos de badges y tags      |
| `--primary-ultra` | `#F0FAFA` | Fondos de sección suaves     |

## Acento · Dorado

| Variable       | Hex       | Uso                              |
|----------------|-----------|----------------------------------|
| `--gold`       | `#C8A96E` | CTA secundarios, detalles premium |
| `--gold-light` | `#F5EDD8` | Fondos con acento dorado         |

## Textos

| Variable        | Hex       | Uso                    |
|-----------------|-----------|------------------------|
| `--text-dark`   | `#1A1A1A` | Titulares y cuerpo principal |
| `--text-medium` | `#555555` | Subtítulos y texto secundario |
| `--text-light`  | `#888888` | Placeholders y notas   |

## Fondos

| Variable    | Hex       | Uso                        |
|-------------|-----------|----------------------------|
| `--bg-white`| `#FFFFFF` | Fondo base                 |
| `--bg-alt`  | `#F8FCFB` | Secciones alternas         |
| `--bg-gray` | `#F5F5F5` | Fondos neutros             |

## Bordes

| Variable  | Hex       | Uso                  |
|-----------|-----------|----------------------|
| `--border`| `#E0E0E0` | Bordes de componentes |

## Footer & Hero

| Variable        | Hex       | Uso                       |
|-----------------|-----------|---------------------------|
| `--footer-bg`   | `#1C1C1C` | Fondo del footer          |
| `--footer-text` | `#CCCCCC` | Texto del footer          |
| `--hero-dark`   | `#082220` | Fondo oscuro del hero     |

---

## CSS Custom Properties (listo para pegar)

```css
:root {
  /* Primario */
  --primary:         #30BAAA;
  --primary-dark:    #259990;
  --primary-darker:  #1A7A6D;
  --primary-light:   #E0F5F3;
  --primary-ultra:   #F0FAFA;

  /* Dorado */
  --gold:            #C8A96E;
  --gold-light:      #F5EDD8;

  /* Textos */
  --text-dark:       #1A1A1A;
  --text-medium:     #555555;
  --text-light:      #888888;

  /* Fondos */
  --bg-white:        #FFFFFF;
  --bg-alt:          #F8FCFB;
  --bg-gray:         #F5F5F5;

  /* Bordes */
  --border:          #E0E0E0;

  /* Footer */
  --footer-bg:       #1C1C1C;
  --footer-text:     #CCCCCC;

  /* Hero */
  --hero-dark:       #082220;

  /* Tipografía */
  --serif:           'Playfair Display', Georgia, serif;
  --sans:            'Open Sans', system-ui, sans-serif;
}
```

## Tipografía

| Rol      | Familia             | Uso                          |
|----------|---------------------|------------------------------|
| Display  | Playfair Display    | Titulares, logo (italic 600) |
| Body     | Open Sans           | Cuerpo de texto (300–700)    |
