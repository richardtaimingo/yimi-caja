# Sarabia Eyewear — By Jennifer Sarabia

Landing page / web app DTC para armazones oftálmicos y de sol, con compra y personalización por WhatsApp.
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · Lucide React · Geist.

## Desarrollo

```bash
npm install
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
| 2 | Hero con selector rápido (Para Ver / De Sol / Blue Block) y preview flotante | `components/Hero.tsx` |
| 3 | Scrollytelling "El Arte de Ver Bien" en 4 capítulos (ver abajo) | `components/ArtOfSeeing.tsx` |
| 4 | Catálogo con filtros por estilo y material, swatches, vista frente/ángulo con inclinación 3D | `components/Catalog.tsx` |
| 5 | Configurador en 3 clics (armazón → mica → receta/confirmación) | `components/Configurator.tsx` |
| 6 | Probador virtual "Pruébatelos en vivo" (cámara, foto o maniquí 3D) | `components/tryon/*`, `lib/tryon/*` |
| 7 | Botón flotante "Asesoría en línea" | `components/WhatsAppFab.tsx` |
| 8 | Beneficios, reseñas, FAQ, contacto y footer | `Benefits`, `Testimonials`, `FAQ`, `Contact`, `Footer` |

El filtro del Hero, el catálogo, el configurador y el probador comparten estado mediante `components/ShopProvider.tsx`.

### Scrollytelling "El Arte de Ver Bien"

Una escena fija (`position: sticky`, 640 vh de recorrido) controlada por `useScroll` + `useSpring` de Framer Motion.
Las capas se alinean con unidades de contenedor (`cqw`/`cqh`), así que la composición es la misma en cualquier pantalla.

1. **Materia:** el armazón de acetato gira de perfil a frente y le sigue uno de titanio. Un destello recorre sólo el
   armazón (CSS `mask-image` con su propio recorte) y las cifras cuentan con el scroll.
2. **Micas:** entra el bloque amarillo. Afuera, una cartilla de Snellen se ve borrosa, con reflejos o con luz azul;
   a través de las micas del armazón real se ve nítida (máscara PNG con la forma exacta de cada mica).
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
- `lib/framePhotos.ts` + `public/frames/`: fotos reales recortadas (WebP con transparencia), centros y cajas de mica,
  máscara de micas y versión sin varillas para el probador.
- `lib/faqs.ts`: preguntas frecuentes (también se publican como JSON-LD `FAQPage`).

## Fotos de armazones

Los recortes de `public/frames/` salen de las fotos de referencia con fondo blanco mediante `scripts/`:

```bash
python3 -I scripts/cutout_frames.py <imagenes> public/frames frames.json --export-crops crops   # 1. recortes
node scripts/upscale_frames.mjs crops sr          # 2. super-resolución ESRGAN 4x (ver dependencias en el archivo)
python3 -I scripts/cutout_frames.py <imagenes> public/frames frames.json --sr sr --ts lib/framePhotos.ts  # 3. recorte final
```

El recorte calcula un mate real en el borde (sin halo blanco sobre fondos oscuros ni amarillos), detecta micas
claras y genera sus máscaras. `components/FrameIllustration.tsx` queda como respaldo SVG si un color no tiene foto.

## Antes de publicar

- **Fotografía:** las fotos actuales son referencias de terceros en baja resolución, mejoradas con IA y recortadas. Para el
  lanzamiento usa fotos propias o con licencia (mismo encuadre frontal sobre fondo blanco) y vuelve a correr los scripts.
- **Reseñas y calificación (4.9):** `components/Testimonials.tsx` es contenido de ejemplo; reemplázalo por reseñas reales.
- **Datos operativos:** revisa precios, tiempos de envío, garantías y formas de pago en `lib/products.ts`, `lib/faqs.ts` y `components/Benefits.tsx`.
- **Enlaces legales y redes:** los enlaces legales del footer son ficticios (`#`) y las URLs de redes sociales en `lib/site.ts` son de ejemplo.
