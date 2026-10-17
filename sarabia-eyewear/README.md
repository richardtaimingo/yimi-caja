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
| 3 | Scrollytelling "El Arte de Ver Bien" (materiales → micas → ajuste) | `components/ArtOfSeeing.tsx` |
| 4 | Catálogo con filtros por estilo y material, swatches y vista frente/ángulo | `components/Catalog.tsx` |
| 5 | Configurador en 3 clics (armazón → mica → receta/confirmación) | `components/Configurator.tsx` |
| 6 | Botón flotante "Asesoría en línea" | `components/WhatsAppFab.tsx` |
| 7 | Beneficios, reseñas, FAQ, contacto y footer | `Benefits`, `Testimonials`, `FAQ`, `Contact`, `Footer` |

El filtro del Hero, el catálogo y el configurador comparten estado mediante `components/ShopProvider.tsx`.

## WhatsApp

- Número: `+52 1 55 1902 3635` → `5215519023635` (en `lib/site.ts`).
- `whatsappLink(texto)` genera `https://wa.me/5215519023635?text=...` con `encodeURIComponent`.
- `orderMessage({ model, color, lens })` arma el mensaje estándar:
  `Hola Sarabia Eyewear, me interesa el armazón Roma en color Oro Cepillado con micas monofocales con graduación.`

## Datos mock

- `lib/products.ts`: 8 modelos (4 oftálmicos, 4 de sol) con descripción, colores, material, precio y especificaciones técnicas (medidas, peso, bisagra, tipo de rostro). Incluye las opciones de mica del configurador.
- `lib/faqs.ts`: preguntas frecuentes (también se publican como JSON-LD `FAQPage`).

## Antes de publicar

- **Fotografía:** los armazones se dibujan con `components/FrameIllustration.tsx` (SVG frontal y en ángulo que se re-colorea con los swatches). Para usar fotos reales, sustitúyelo por `next/image` con tus imágenes en `public/`.
- **Reseñas y calificación (4.9):** `components/Testimonials.tsx` es contenido de ejemplo; reemplázalo por reseñas reales.
- **Datos operativos:** revisa precios, tiempos de envío, garantías y formas de pago en `lib/products.ts`, `lib/faqs.ts` y `components/Benefits.tsx`.
- **Enlaces legales y redes:** los enlaces legales del footer son ficticios (`#`) y las URLs de redes sociales en `lib/site.ts` son de ejemplo.
