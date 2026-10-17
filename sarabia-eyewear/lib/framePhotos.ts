import type { ProductPhoto } from "./products";

// Generado por scripts/cutout_frames.py a partir de las fotos de referencia.
// Medidas en px de cada WebP; centros y cajas de mica normalizados (0–1).
//
// ESPECIFICACIÓN PARA REEMPLAZAR LAS FOTOS (nitidez Retina 3x en hero, campaña y catálogo):
// - Vista frontal, master de 2400 px de ancho (mínimo 2000) × su alto natural; resolución nativa,
//   nunca escalada: armazón ocupando ≥ 4000 px del sensor, f/8–f/11 con apilado de foco.
// - PNG-24 RGBA (o WebP sin pérdida) con alfa recto, recorte a pluma, borde ≤ 2 px y sin halo.
// - sRGB IEC61966-2.1 incrustado, balance de blancos neutro, puente centrado y micas niveladas,
//   2 % de margen uniforme. Micas claras: máscara de mica en escala de grises al mismo tamaño.
// - Opcional: vista 3/4 con la misma especificación (sustituye el giro CSS del catálogo).
// Colocar en public/frames y volver a correr scripts/cutout_frames.py --ts lib/framePhotos.ts.
export const framePhotos: Record<string, ProductPhoto> = {
  // Reemplazo: exportar 2400x804 px (ahora 1672x560, escalado con IA)
  "roma-oro-g15": {front: "/frames/roma-oro-g15.webp", mask: "/frames/masks/roma-oro-g15.png", width: 1672, height: 560, lensCenters: [[0.27, 0.486], [0.73, 0.495]]},
  // Reemplazo: exportar 2400x727 px (ahora 1664x504, escalado con IA)
  "roma-oro-cafe": {front: "/frames/roma-oro-cafe.webp", mask: "/frames/masks/roma-oro-cafe.png", width: 1664, height: 504, lensCenters: [[0.239, 0.509], [0.746, 0.499]]},
  // Reemplazo: exportar 2400x854 px (ahora 1664x592, escalado con IA)
  "roma-vino-cafe": {front: "/frames/roma-vino-cafe.webp", mask: "/frames/masks/roma-vino-cafe.png", width: 1664, height: 592, lensCenters: [[0.252, 0.381], [0.746, 0.382]]},
  // Reemplazo: exportar 2400x788 px (ahora 1584x520, escalado con IA)
  "tulum-oro-verde": {front: "/frames/tulum-oro-verde.webp", mask: "/frames/masks/tulum-oro-verde.png", width: 1584, height: 520, lensCenters: [[0.257, 0.504], [0.741, 0.502]]},
  // Reemplazo: exportar 2400x719 px (ahora 1656x496, escalado con IA)
  "tulum-negro-oro": {front: "/frames/tulum-negro-oro.webp", mask: "/frames/masks/tulum-negro-oro.png", width: 1656, height: 496, lensCenters: [[0.264, 0.487], [0.739, 0.486]]},
  // Reemplazo: exportar 2400x891 px (ahora 1616x600, escalado con IA)
  "mateo-carey": {front: "/frames/mateo-carey.webp", mask: "/frames/masks/mateo-carey.png", width: 1616, height: 600, lensCenters: [[0.279, 0.466], [0.723, 0.475]], tryOn: "/frames/mateo-carey-tryon.webp", lensMask: "/frames/mateo-carey-lens.png", lensBoxes: [[0.129, 0.15, 0.427, 0.818], [0.572, 0.148, 0.869, 0.83]]},
  // Reemplazo: exportar 2400x1062 px (ahora 1392x616, escalado con IA)
  "mateo-negro": {front: "/frames/mateo-negro.webp", mask: "/frames/masks/mateo-negro.png", width: 1392, height: 616, lensCenters: [[0.265, 0.498], [0.736, 0.498]], tryOn: "/frames/mateo-negro-tryon.webp", lensMask: "/frames/mateo-negro-lens.png", lensBoxes: [[0.123, 0.226, 0.412, 0.81], [0.588, 0.226, 0.877, 0.812]]},
  // Reemplazo: exportar 2400x808 px (ahora 1520x512, escalado con IA)
  "valeria-verde": {front: "/frames/valeria-verde.webp", mask: "/frames/masks/valeria-verde.png", width: 1520, height: 512, lensCenters: [[0.263, 0.53], [0.735, 0.526]], tryOn: "/frames/valeria-verde-tryon.webp", lensMask: "/frames/valeria-verde-lens.png", lensBoxes: [[0.095, 0.213, 0.432, 0.926], [0.566, 0.193, 0.903, 0.926]]},
  // Reemplazo: exportar 2400x937 px (ahora 1496x584, escalado con IA)
  "costa-carey-g15": {front: "/frames/costa-carey-g15.webp", mask: "/frames/masks/costa-carey-g15.png", width: 1496, height: 584, lensCenters: [[0.266, 0.52], [0.735, 0.52]]},
  // Reemplazo: exportar 2400x902 px (ahora 1512x568, escalado con IA)
  "costa-negro-humo": {front: "/frames/costa-negro-humo.webp", mask: "/frames/masks/costa-negro-humo.png", width: 1512, height: 568, lensCenters: [[0.27, 0.436], [0.738, 0.435]]},
  // Reemplazo: exportar 2400x831 px (ahora 2472x856, escalado con IA)
  "costa-carey-degradado": {front: "/frames/costa-carey-degradado.webp", mask: "/frames/masks/costa-carey-degradado.png", width: 2472, height: 856, lensCenters: [[0.256, 0.495], [0.745, 0.494]]},
  // Reemplazo: exportar 2400x659 px (ahora 2504x688, escalado con IA)
  "olivia-negro-humo": {front: "/frames/olivia-negro-humo.webp", mask: "/frames/masks/olivia-negro-humo.png", width: 2504, height: 688, lensCenters: [[0.236, 0.504], [0.761, 0.504]]},
  // Reemplazo: exportar 2400x789 px (ahora 1704x560, escalado con IA)
  "olivia-carey-cafe": {front: "/frames/olivia-carey-cafe.webp", mask: "/frames/masks/olivia-carey-cafe.png", width: 1704, height: 560, lensCenters: [[0.273, 0.494], [0.731, 0.495]]},
  // Reemplazo: exportar 2400x734 px (ahora 2408x736, escalado con IA)
  "olivia-cafe": {front: "/frames/olivia-cafe.webp", mask: "/frames/masks/olivia-cafe.png", width: 2408, height: 736, lensCenters: [[0.252, 0.428], [0.743, 0.425]]},
  // Reemplazo: exportar 2400x789 px (ahora 2312x760, escalado con IA)
  "gata-negro": {front: "/frames/gata-negro.webp", mask: "/frames/masks/gata-negro.png", width: 2312, height: 760, lensCenters: [[0.252, 0.498], [0.73, 0.475]]},
  // Reemplazo: exportar 2400x878 px (ahora 1640x600, escalado con IA)
  "gata-carey": {front: "/frames/gata-carey.webp", mask: "/frames/masks/gata-carey.png", width: 1640, height: 600, lensCenters: [[0.241, 0.499], [0.756, 0.498]]},
  // Reemplazo: exportar 2400x711 px (ahora 2456x728, escalado con IA)
  "brava-carey": {front: "/frames/brava-carey.webp", mask: "/frames/masks/brava-carey.png", width: 2456, height: 728, lensCenters: [[0.238, 0.494], [0.761, 0.505]]},
  // Reemplazo: exportar 2400x728 px (ahora 1608x488, escalado con IA)
  "brava-negro-g15": {front: "/frames/brava-negro-g15.webp", mask: "/frames/masks/brava-negro-g15.png", width: 1608, height: 488, lensCenters: [[0.267, 0.502], [0.729, 0.509]]},
  // Reemplazo: exportar 2400x708 px (ahora 1736x512, escalado con IA)
  "brava-miel": {front: "/frames/brava-miel.webp", mask: "/frames/masks/brava-miel.png", width: 1736, height: 512, lensCenters: [[0.268, 0.501], [0.705, 0.5]]},
  // Reemplazo: exportar 2400x610 px (ahora 2456x624, escalado con IA)
  "lince-oro-humo": {front: "/frames/lince-oro-humo.webp", mask: "/frames/masks/lince-oro-humo.png", width: 2456, height: 624, lensCenters: [[0.259, 0.503], [0.743, 0.503]]},
  // Reemplazo: exportar 2400x696 px (ahora 1600x464, escalado con IA)
  "lince-negro-humo": {front: "/frames/lince-negro-humo.webp", mask: "/frames/masks/lince-negro-humo.png", width: 1600, height: 464, lensCenters: [[0.258, 0.504], [0.734, 0.489]]},
  // Reemplazo: exportar 2400x687 px (ahora 1592x456, escalado con IA)
  "luna-carey-oro": {front: "/frames/luna-carey-oro.webp", mask: "/frames/masks/luna-carey-oro.png", width: 1592, height: 456, lensCenters: [[0.266, 0.492], [0.734, 0.49]]},
  // Reemplazo: exportar 2400x962 px (ahora 1616x648, escalado con IA)
  "andes-negro": {front: "/frames/andes-negro.webp", mask: "/frames/masks/andes-negro.png", width: 1616, height: 648, lensCenters: [[0.261, 0.518], [0.745, 0.521]]},
};
