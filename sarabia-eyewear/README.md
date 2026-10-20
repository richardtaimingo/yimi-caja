# Sarabia Eyewear — By Jennifer Sarabia

Landing page / web app DTC para armazones oftálmicos y de sol, con compra y personalización por WhatsApp.
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · Lenis · Lucide React · Geist.

## Desarrollo

```bash
npm install                       # incluye lenis@1.3.26 (versión fija) para el scroll suave
npm run dev        # http://localhost:3000
npm run typecheck  # verificación de tipos
npm run build      # build de producción
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. En **Root Directory** selecciona `sarabia-eyewear` (el framework Next.js se detecta solo).
3. Opcional: define `NEXT_PUBLIC_SITE_URL` con tu dominio final (se usa en metadatos, `sitemap.xml` y `robots.txt`).

La página se prerenderiza 100 % estática (SSG): no hay APIs ni funciones de servidor, se sirve desde la CDN de Vercel.
Todos los componentes con Framer Motion o estado llevan `"use client"`.

## Secciones

| # | Sección | Componente |
| --- | --- | --- |
| 1 | Header sticky + botón "Pedir por WhatsApp" | `components/Header.tsx` |
| 2 | Hero tipo póster de campaña con selector rápido (Para Ver / De Sol / Blue Block) y armazón flotante | `components/Hero.tsx` |
| 2a | "Inmersión": secuencia controlada por scroll, el Costa real cae al agua (ver abajo) | `components/Immersion.tsx`, `lib/immersion/*` |
| 2b | Telón "Diseñados en México. Ajustados a ti." con cifras, que sube sobre la escena | `components/Proof.tsx` |
| 2c | Campaña en 6 pósters (fotos reales con gradación azul; cada uno abre el probador) | `components/Campaign.tsx` |
| 3 | Scrollytelling "El Arte de Ver Bien" en 4 capítulos (ver abajo) | `components/ArtOfSeeing.tsx` |
| 4 | Catálogo con filtros por estilo y material, swatches, vista frente/ángulo con inclinación 3D | `components/Catalog.tsx` |
| 5 | Configurador en 3 clics (armazón → mica → receta/confirmación) | `components/Configurator.tsx` |
| 6 | Probador virtual "Pruébatelos en vivo" (cámara, foto o maniquí 3D) | `components/tryon/*`, `lib/tryon/*` |
| 7 | Botón flotante "Asesoría en línea" | `components/WhatsAppFab.tsx` |
| 8 | Beneficios, reseñas, FAQ, contacto y footer | `Benefits`, `Testimonials`, `FAQ`, `Contact`, `Footer` |

El filtro del Hero, el catálogo, el configurador y el probador comparten estado mediante `components/ShopProvider.tsx`.

### Dirección visual

Blanco de lujo editorial (sin azul). El único color de la interfaz es el producto, más el verde de WhatsApp en su icono.
- **Paleta** (`tailwind.config.ts`):
  - `canvas`: blanco, con dos grises cálidos de apoyo (`canvas-2`, `canvas-3`).
  - `ink`: tinta casi negra para el texto y los botones llenos.
  - `mute`: texto secundario.
  - Los textos pequeños nunca bajan de `ink/60`, unos 5:1 de contraste.
- **Ritmo:** secciones blancas y gris cálido, con momentos en grafito (pósters alternos, el capítulo de Micas, el reverso
  de la espiral) y el footer en tinta.
- **Tipografía:**
  - Titulares editoriales en grotesca ligera (`.headline`: hero, telón, diseñadora).
  - Marca y titulares de sección en la sans extendida Michroma (`.display`).
  - Etiquetas de 11 px como mínimo (`.eyebrow`, `.micro`) y fichas técnicas en Geist Mono.
- **Botones** (`app/globals.css`):
  - Tinta llena (`.btn-primary`, `.btn-volt` para comprar por WhatsApp).
  - Contorno (`.btn-outline`).
  - Blanco lleno sobre fondos oscuros (`.btn-paper`).
  - Los llenos tienen un brillo perimetral (`@property --beam`) y los CTA principales, atracción magnética
    (`components/Magnetic.tsx`).
- **Foco:** contorno de tinta con halo blanco. En zonas oscuras, la clase `.on-dark` lo pasa a blanco.
- **Fotos:**
  - `.stage-studio` es el estudio gris cálido del catálogo, el configurador, el probador y las tarjetas.
  - `components/LitFrame.tsx` añade luz de contorno, y `.grade-duotone` (filtro SVG `#sb-duotone` en `app/layout.tsx`)
    da un blanco y negro editorial.

### Rendimiento y estabilidad

- **Scroll suave:** Lenis (`components/SmoothScroll.tsx`) sólo con rueda o trackpad y sin "reducir movimiento"; en
  táctil se conserva la inercia nativa.
  - Comparte el bucle de animación con Framer Motion.
  - Maneja los enlaces internos respetando `scroll-margin-top`.
  - Se detiene con `lockScroll()` / `unlockScroll()` (`lib/scroll.ts`) mientras hay un modal o menú abierto.
- **Hero:**
  - En móvil ocupa exactamente `100svh` menos el header: el CTA siempre queda visible y no salta al ocultarse la barra
    del navegador. En teléfonos en horizontal (variante `short:`) se acomoda en dos columnas.
  - Escenario de tamaño fijo con crossfade y textos de cada pestaña apilados, para CLS 0.
  - La levitación y la deriva de luz son animaciones CSS del compositor.
  - La primera imagen se renderiza visible desde el servidor (LCP).
- **Animaciones con Framer:** se animan `opacity` y `transform` como cadena para que corran por WAAPI.
- **Scrollytelling:**
  - Sin `useSpring` (Lenis ya suaviza) y las escenas fuera de rango usan `display: none`.
  - La colección vuela con transform (no mueve el layout).
- **Header:** se retira al bajar y vuelve al subir, para que las escenas a pantalla completa queden limpias.
- **Botón de WhatsApp:** no aparece sobre el hero, Inmersión ni contacto, y se aparta cuando un control marcado con
  `data-fab-avoid` pasa por su franja.
- **Fuente:** Michroma va incrustada (`app/fonts/michroma.css`), así que no hay cambio de fuente que mueva el layout.
- **Imágenes:** sólo WebP (el alfa queda sin pérdida), calidad 90 en los armazones y `deviceSizes` pensados para 2x/3x.

### Inmersión (secuencia controlada por scroll)

Sección de 500svh con una escena fija de 100svh. Los primeros 300svh de scroll recorren la secuencia y los últimos
100svh son el telón: `Proof.tsx` tiene `-mt-[100svh]` y sube por encima de la escena.

1. El Costa en carey (foto real) levita en un estudio blanco sobre agua cristalina, con tres tarjetas de vidrio.
2. Cae, toca el agua y salpica: gotas, espuma, ondas y una bolsa de aire que se cierra en burbujas.
3. Se hunde mientras la cámara lo sigue. Aparecen tarjetas a los lados, la marca SARABIA gigante y, al final, el modelo
   con sus CTA.

Cómo está hecha:
- **Render:** `lib/immersion/renderer.ts` dibuja con WebGL2, sin dependencias, a la resolución de la pantalla (hasta 2x,
  con tope de píxeles y calidad adaptativa).
  - Una pasada de pantalla completa: aire, superficie con oleaje, agua con rayos de luz y cáusticas, cavidad y la foto del
    armazón con refracción y absorción.
  - Una pasada instanciada: gotas, burbujas y bokeh.
- **Línea de tiempo:** `lib/immersion/timeline.ts` calcula todo el estado como función pura del avance del scroll (y del
  reloj sólo para el oleaje). La secuencia se puede recorrer hacia atrás cuadro por cuadro, como un video.
- **Sincronía:** el canvas y los textos se actualizan en el mismo frame de Framer Motion que mueve Lenis. Los textos sólo
  cambian `opacity` y `transform`, y cada tarjeta de vidrio anima su propia opacidad para no perder el `backdrop-filter`.
- **Carga:** los shaders y la foto se preparan cuando la sección está a 1.5 pantallas, y sólo se dibuja mientras está a
  la vista.
- **Respaldos:** sin WebGL2 se muestran la foto y las tarjetas sobre un degradado. Con "reducir movimiento" se dibuja un
  solo cuadro, sin pin.
- **Títulos:** `components/CharReveal.tsx` revela letra por letra, en orden aleatorio estable, los titulares de sección y
  del telón. El texto completo queda para lectores de pantalla.

### Scrollytelling "El Arte de Ver Bien"

Una escena fija (`position: sticky`, 640 vh de recorrido) controlada por `useScroll` de Framer Motion.
Las capas se alinean con unidades de contenedor (`cqw`/`cqh`), así que la composición es la misma en cualquier pantalla.

1. **Materia:** el armazón de acetato gira de perfil a frente y le sigue uno de titanio. Un destello recorre sólo el
   armazón (CSS `mask-image` con su propio recorte) y las cifras cuentan con el scroll.
2. **Micas:** entra el bloque de luz azul. Afuera, una cartilla de Snellen se ve borrosa, con reflejos o con luz azul-violeta;
   a través de las micas del armazón real se ve nítida (y neutra con Blue Block) (máscara PNG con la forma exacta de cada mica).
3. **Medida:** plano técnico con cotas SVG que se trazan solas (ancho total, calibre, puente, distancia pupilar).
4. **Colección:** los 11 armazones vuelan a una cuadrícula; cada uno abre el probador.

El texto completo también está en una lista `sr-only` para lectores de pantalla.

### Probador virtual

- `components/tryon/TryOnModal.tsx`: pide la cámara ("Activa tu cámara para probarte los [Modelo] en tiempo real"),
  con alternativas de subir foto o maniquí 3D. El carrusel cambia modelo y color en vivo, "Tomar foto" descarga la
  captura y el botón de WhatsApp envía:
  `Hola, me acabo de probar los [NombreDelModelo] en color [Color] en su probador virtual y me encantaron. Quiero pedirlos.`
- `lib/tryon/faceTracker.ts`: MediaPipe Face Landmarker (`@mediapipe/tasks-vision`, versión fija) cargado bajo demanda.
  El WASM y el modelo se pueden servir desde tu dominio con `NEXT_PUBLIC_MEDIAPIPE_WASM_URL` y `NEXT_PUBLIC_FACE_MODEL_URL`.
- `lib/tryon/geometry.ts`: posición, escala, inclinación (roll), giro (yaw) y cabeceo (pitch) a partir de los
  landmarks 33/263/133/362 y 168/6; los lentes se anclan con los centros de mica de cada foto.
- Al cerrar el modal o cambiar de modo se detienen todas las pistas de la cámara.

## WhatsApp

- Número: `+52 1 55 1902 3635` → `5215519023635` (en `lib/site.ts`).
- `whatsappLink(texto)` genera `https://wa.me/5215519023635?text=...` con `encodeURIComponent`.
- `orderMessage({ model, color, lens })` arma el mensaje estándar:
  `Hola Sarabia Eyewear, me interesa el armazón Roma en color Oro Cepillado con micas monofocales con graduación.`

## Datos mock

- `lib/products.ts`: 11 modelos (2 oftálmicos, 9 de sol) con descripción, colores, material, precio y especificaciones técnicas (medidas, peso, bisagra, tipo de rostro). Incluye las opciones de mica del configurador.
- `lib/framePhotos.ts` + `public/frames/`: fotos reales recortadas (WebP con transparencia), siluetas ligeras para los
  efectos (`public/frames/masks/`), centros y cajas de mica, máscara de micas y versión sin varillas para el probador.
- `lib/faqs.ts`: preguntas frecuentes (también se publican como JSON-LD `FAQPage`).

## Fotos de armazones

Los recortes de `public/frames/` salen de las fotos de referencia con fondo blanco mediante `scripts/`:

```bash
python3 -I scripts/cutout_frames.py <imagenes> public/frames frames.json --export-crops crops   # 1. recortes
node scripts/upscale_frames.mjs crops sr 8        # 2. super-resolución ESRGAN 8x (ver dependencias en el archivo)
python3 -I scripts/cutout_frames.py <imagenes> public/frames frames.json --sr sr --ts lib/framePhotos.ts  # 3. recorte final
```

Qué hace el recorte:
- Calcula un mate real en el borde: toma el color del armazón, aprieta el alfa y elimina motas sueltas, así que no
  queda halo sobre fondos oscuros o de color.
- Detecta las micas claras y genera sus máscaras y las siluetas ligeras.
- Escribe en `lib/framePhotos.ts` la medida del master que debe exportarse para cada armazón.

`components/FrameIllustration.tsx` queda como respaldo SVG si un color no tiene foto.

**Especificación para reemplazar las fotos** (nitidez Retina 3x):
- **Encuadre y resolución:** vista frontal, master de 2400 px de ancho (mínimo 2000) en resolución nativa, nunca
  escalada.
- **Formato:** PNG-24 RGBA o WebP sin pérdida, con alfa recto y borde de 2 px o menos, sin halo.
- **Color:** sRGB, puente centrado, micas niveladas y 2 % de margen uniforme.
- **Micas claras:** una máscara de mica en escala de grises del mismo tamaño.

## Antes de publicar

- **Fotografía:** las fotos actuales son referencias de terceros de ~200 px, ampliadas 8x con IA y recortadas. La IA
  limpia los bordes, pero inventa el detalle fino (carey, remaches). Para el lanzamiento usa fotos propias o con
  licencia con la especificación de arriba y vuelve a correr los scripts.
- **Reseñas y calificación (4.9):** `components/Testimonials.tsx` es contenido de ejemplo; reemplázalo por reseñas reales.
- **Datos operativos:** revisa precios, tiempos de envío, garantías y formas de pago en `lib/products.ts`, `lib/faqs.ts` y `components/Benefits.tsx`.
- **Enlaces legales y redes:** los enlaces legales del footer son ficticios (`#`) y las URLs de redes sociales en `lib/site.ts` son de ejemplo.
