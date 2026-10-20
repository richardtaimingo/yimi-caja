import { framePhotos } from "./framePhotos";

export type FrameShape = "round" | "square" | "cateye" | "aviator";
export type Material = "acetato" | "titanio" | "mixto";
export type Category = "oftalmico" | "sol";

export type Colorway = {
  id: string;
  name: string;
  /** Color principal del armazón (para el swatch). */
  frame: string;
  /** Color del metal en armazones mixtos o metálicos. */
  metal?: string;
  /** Patrón del acetato. */
  pattern?: "tortoise" | "crystal";
  /** Tinte de la mica (lentes de sol). */
  lens?: string;
  /** Fotografía real del armazón en este color. */
  photo?: ProductPhoto;
};

export type ProductPhoto = {
  /** Recorte WebP con fondo transparente, vista frontal (catálogo, hero y probador virtual). */
  front: string;
  /** Silueta ligera (sólo alfa, 640 px) para los efectos de luz con CSS mask-image. */
  mask?: string;
  /** Vista en ángulo 3/4 (opcional). */
  angle?: string;
  /** Versión para el probador sin las varillas que se ven a través de micas claras. */
  tryOn?: string;
  /** Máscara de las micas (sólo micas claras): se usa en el scrollytelling. */
  lensMask?: string;
  width: number;
  height: number;
  /** Centros de las micas en la foto frontal (0–1), para alinear el probador virtual. */
  lensCenters: [[number, number], [number, number]];
  /** Cajas de las micas [x0, y0, x1, y1] (0–1), cuando son claras. */
  lensBoxes?: [number, number, number, number][];
  credit?: { author: string; url: string };
};

export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  shape: FrameShape;
  material: Material;
  price: number;
  badge?: "Nuevo" | "Best Seller" | "Edición limitada";
  /** Blue Block recomendado (aparece en el filtro rápido del Hero). */
  blueBlockReady?: boolean;
  specs: {
    lens: number; // ancho de mica (mm)
    bridge: number; // puente (mm)
    temple: number; // varilla (mm)
    weight: number; // gramos
    hinge: string;
    fit: "Angosto" | "Medio" | "Amplio";
  };
  colors: Colorway[];
};

export const shapeLabels: Record<FrameShape, string> = {
  round: "Redondos",
  square: "Cuadrados",
  cateye: "Cat-Eye",
  aviator: "Aviador",
};

export const materialLabels: Record<Material, { label: string; badge: string }> = {
  acetato: { label: "Acetato", badge: "Acetato italiano" },
  titanio: { label: "Titanio", badge: "Titanio ultraligero" },
  mixto: { label: "Mixto", badge: "Acetato + Titanio" },
};

const photo = (id: string) => framePhotos[id];

export const products: Product[] = [
  {
    id: "mateo",
    name: "Mateo",
    tagline: "Cuadrado de autor con remaches de acero.",
    description:
      "Líneas rectas, aristas suaves y un grosor que da carácter sin pesar. El armazón que usarías en la oficina, en la cena y en la foto del pasaporte.",
    category: "oftalmico",
    shape: "square",
    material: "acetato",
    price: 1890,
    badge: "Best Seller",
    blueBlockReady: true,
    specs: { lens: 51, bridge: 20, temple: 145, weight: 24, hinge: "Bisagra flex de 5 barriles", fit: "Amplio" },
    colors: [
      { id: "carey", name: "Carey Habana", frame: "#4A2A18", pattern: "tortoise", photo: photo("mateo-carey") },
      { id: "negro", name: "Negro Piano", frame: "#111111", photo: photo("mateo-negro") },
    ],
  },
  {
    id: "valeria",
    name: "Valeria",
    tagline: "Cat-eye en acetato verde bosque.",
    description:
      "Una ceja que se eleva con intención y un verde translúcido que cambia con la luz. Para quien entra a un lugar y se queda.",
    category: "oftalmico",
    shape: "cateye",
    material: "acetato",
    price: 1790,
    badge: "Nuevo",
    blueBlockReady: true,
    specs: { lens: 53, bridge: 17, temple: 145, weight: 21, hinge: "Bisagra flex de 5 barriles", fit: "Medio" },
    colors: [{ id: "verde", name: "Verde Bosque", frame: "#3E5A2E", pattern: "crystal", photo: photo("valeria-verde") }],
  },
  {
    id: "costa",
    name: "Costa",
    tagline: "Aviador de doble puente en acetato.",
    description:
      "Gotas amplias, doble puente y micas que cortan el deslumbramiento del asfalto y del mar. Para carretera, playa y ciudad.",
    category: "sol",
    shape: "aviator",
    material: "acetato",
    price: 2190,
    badge: "Best Seller",
    specs: { lens: 56, bridge: 16, temple: 145, weight: 27, hinge: "Bisagra flex de 7 barriles", fit: "Amplio" },
    colors: [
      { id: "carey-g15", name: "Carey / G-15", frame: "#3B2416", pattern: "tortoise", lens: "#3E4A36", photo: photo("costa-carey-g15") },
      { id: "negro-humo", name: "Negro / Humo", frame: "#141414", lens: "#2E3440", photo: photo("costa-negro-humo") },
      { id: "carey-degradado", name: "Carey / Degradado", frame: "#5A3416", pattern: "tortoise", lens: "#6B4426", photo: photo("costa-carey-degradado") },
    ],
  },
  {
    id: "roma",
    name: "Roma",
    tagline: "Óvalo metálico de inspiración noventera.",
    description:
      "Aro fino de metal pulido y micas ovaladas. Retro en la forma, ligero en la cara, imposible de pasar desapercibido.",
    category: "sol",
    shape: "round",
    material: "titanio",
    price: 2290,
    badge: "Nuevo",
    specs: { lens: 54, bridge: 19, temple: 140, weight: 16, hinge: "Bisagra de titanio con resorte", fit: "Medio" },
    colors: [
      { id: "oro-g15", name: "Oro / G-15", frame: "#C9A55A", lens: "#3E4A36", photo: photo("roma-oro-g15") },
      { id: "oro-cafe", name: "Oro / Café", frame: "#C9A55A", lens: "#4A3A30", photo: photo("roma-oro-cafe") },
      { id: "vino-cafe", name: "Vino / Café", frame: "#6B2328", lens: "#5A4038", photo: photo("roma-vino-cafe") },
    ],
  },
  {
    id: "olivia",
    name: "Olivia",
    tagline: "Óvalo grueso de acetato. Puro 90s.",
    description:
      "Volumen redondeado y micas pequeñas que estilizan el rostro. El lente que se ve igual de bien con traje que con camiseta.",
    category: "sol",
    shape: "round",
    material: "acetato",
    price: 1690,
    specs: { lens: 52, bridge: 20, temple: 145, weight: 25, hinge: "Bisagra flex de 5 barriles", fit: "Medio" },
    colors: [
      { id: "negro-humo", name: "Negro / Humo", frame: "#0E0E0E", lens: "#3A3A3A", photo: photo("olivia-negro-humo") },
      { id: "carey-cafe", name: "Carey / Café", frame: "#5A3416", pattern: "tortoise", lens: "#7A5030", photo: photo("olivia-carey-cafe") },
      { id: "caramelo", name: "Caramelo", frame: "#6E4A2C", pattern: "crystal", lens: "#5B3A24", photo: photo("olivia-cafe") },
    ],
  },
  {
    id: "tulum",
    name: "Tulum",
    tagline: "Cat-eye mixto: ceja de acetato, aro de metal.",
    description:
      "Un ángulo felino suavizado con metal dorado. Micas amplias con protección UV400 para días largos de sol.",
    category: "sol",
    shape: "cateye",
    material: "mixto",
    price: 2090,
    badge: "Edición limitada",
    specs: { lens: 55, bridge: 17, temple: 142, weight: 18, hinge: "Bisagra metálica con resorte", fit: "Medio" },
    colors: [
      { id: "oro-verde", name: "Oro / Verde", frame: "#C9A55A", metal: "#C9A55A", lens: "#4E6A48", photo: photo("tulum-oro-verde") },
      { id: "negro-oro", name: "Negro / Oro", frame: "#151515", metal: "#C9A55A", lens: "#4A4442", photo: photo("tulum-negro-oro") },
    ],
  },
  {
    id: "gata",
    name: "Gata",
    tagline: "Cat-eye afilado. Actitud de cine.",
    description:
      "Puntas que se elevan como un trazo de delineador. El clásico de pantalla grande, en acetato pulido a mano.",
    category: "sol",
    shape: "cateye",
    material: "acetato",
    price: 1590,
    specs: { lens: 52, bridge: 18, temple: 140, weight: 22, hinge: "Bisagra flex de 5 barriles", fit: "Angosto" },
    colors: [
      { id: "negro", name: "Negro Brillante", frame: "#0A0A0A", lens: "#1C1C1C", photo: photo("gata-negro") },
      { id: "carey", name: "Carey / Ámbar", frame: "#4A2A18", pattern: "tortoise", lens: "#8A5A30", photo: photo("gata-carey") },
    ],
  },
  {
    id: "brava",
    name: "Brava",
    tagline: "Rectangular de acetato grueso.",
    description:
      "Frente de alta densidad y micas planas que cubren de verdad. El par que convierte cualquier outfit en declaración.",
    category: "sol",
    shape: "square",
    material: "acetato",
    price: 1690,
    specs: { lens: 53, bridge: 19, temple: 145, weight: 26, hinge: "Bisagra flex de 5 barriles", fit: "Amplio" },
    colors: [
      { id: "carey", name: "Carey / Café", frame: "#5A3416", pattern: "tortoise", lens: "#6A4A2E", photo: photo("brava-carey") },
      { id: "negro-g15", name: "Negro / G-15", frame: "#121212", lens: "#4B5A48", photo: photo("brava-negro-g15") },
      { id: "miel", name: "Carey Miel", frame: "#9A6A34", pattern: "tortoise", lens: "#A0663A", photo: photo("brava-miel") },
    ],
  },
  {
    id: "lince",
    name: "Lince",
    tagline: "Rectangular metálico, minimal y preciso.",
    description:
      "Aro delgado de metal y micas rectangulares. Ligero, discreto y con la precisión de un instrumento.",
    category: "sol",
    shape: "square",
    material: "titanio",
    price: 1990,
    specs: { lens: 55, bridge: 18, temple: 140, weight: 14, hinge: "Bisagra de titanio con tornillo antiaflojante", fit: "Medio" },
    colors: [
      { id: "oro-humo", name: "Oro / Humo", frame: "#C9A55A", lens: "#2C2C2E", photo: photo("lince-oro-humo") },
      { id: "negro-humo", name: "Negro / Humo", frame: "#161616", lens: "#26282C", photo: photo("lince-negro-humo") },
    ],
  },
  {
    id: "luna",
    name: "Luna",
    tagline: "Media luna: carey abajo, metal arriba.",
    description:
      "Aro inferior de acetato carey y ceja de metal dorado. Una silueta ligera que deja ver la mirada.",
    category: "sol",
    shape: "cateye",
    material: "mixto",
    price: 2190,
    specs: { lens: 52, bridge: 19, temple: 140, weight: 17, hinge: "Bisagra metálica con resorte", fit: "Medio" },
    colors: [{ id: "carey-oro", name: "Carey / Oro", frame: "#5A3416", pattern: "tortoise", metal: "#C9A55A", lens: "#4E5A40", photo: photo("luna-carey-oro") }],
  },
  {
    id: "andes",
    name: "Andes",
    tagline: "Máscara aviador de una sola pieza.",
    description:
      "Frente envolvente de acetato negro y micas G-15. Para la carretera de montaña y los días de sol sin tregua.",
    category: "sol",
    shape: "aviator",
    material: "acetato",
    price: 1890,
    specs: { lens: 60, bridge: 14, temple: 140, weight: 30, hinge: "Bisagra flex de 7 barriles", fit: "Amplio" },
    colors: [{ id: "negro-g15", name: "Negro / G-15", frame: "#0E0E0E", lens: "#4B5A48", photo: photo("andes-negro") }],
  },
];

export type LensOptionId = "blue" | "mono" | "solo";
export type LensOption = { id: LensOptionId; name: string; short: string; description: string; price: number; needsRx: boolean };

/** Las tres opciones de mica del configurador; para lentes de sol se adaptan los textos. */
export function lensOptionsFor(category: Category): LensOption[] {
  if (category === "sol") {
    return [
      { id: "solo", name: "Micas solares de fábrica", short: "solares de fábrica UV400", description: "Listos para usar, con protección UV400.", price: 0, needsRx: false },
      { id: "mono", name: "Solares con graduación", short: "solares monofocales con graduación", description: "Tu graduación en mica solar polarizada.", price: 990, needsRx: true },
    ];
  }
  return [
    { id: "blue", name: "Neutras con Blue Block", short: "neutras con Blue Block", description: "Sin graduación. Filtran la luz azul de pantallas.", price: 490, needsRx: false },
    { id: "mono", name: "Monofocales con graduación", short: "monofocales con graduación", description: "Antirreflejante + UV incluidos. Envías tu receta.", price: 690, needsRx: true },
    { id: "solo", name: "Solo armazón", short: "(solo armazón, sin micas)", description: "Para graduar en tu óptica de confianza.", price: 0, needsRx: false },
  ];
}
