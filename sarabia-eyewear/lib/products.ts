export type FrameShape = "round" | "square" | "cateye" | "aviator";
export type Material = "acetato" | "titanio" | "mixto";
export type Category = "oftalmico" | "sol";

export type Colorway = {
  id: string;
  name: string;
  /** Color principal del armazón (o color base si lleva patrón). */
  frame: string;
  /** Color del metal en armazones mixtos (browline). */
  metal?: string;
  /** Patrón opcional para acetatos. */
  pattern?: "tortoise" | "crystal";
  /** Tinte de la mica (sólo armazones de sol). */
  lens?: string;
  /** Fotografía real del armazón en este color. */
  photo?: ProductPhoto;
};

export type ProductPhoto = {
  /** Recorte PNG/WebP con fondo transparente, vista frontal (catálogo, hero y probador virtual). */
  front: string;
  /** Vista en ángulo 3/4 (opcional). */
  angle?: string;
  width: number;
  height: number;
  /** Centros de las micas en la foto frontal (0–1), para alinear el probador virtual. */
  lensCenters: [[number, number], [number, number]];
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

export const products: Product[] = [
  {
    id: "valeria",
    name: "Valeria",
    tagline: "Cat-eye editorial de esquinas afiladas.",
    description:
      "Nuestro icono. Una línea superior que se eleva con intención y un frente pulido a mano que atrapa la luz. Para quien entra a un lugar y se queda.",
    category: "oftalmico",
    shape: "cateye",
    material: "acetato",
    price: 1890,
    badge: "Best Seller",
    blueBlockReady: true,
    specs: { lens: 52, bridge: 18, temple: 145, weight: 22, hinge: "Bisagra flex de 5 barriles", fit: "Medio" },
    colors: [
      { id: "negro", name: "Negro Piano", frame: "#151514" },
      { id: "carey", name: "Carey Habana", frame: "#6B3E1F", pattern: "tortoise" },
      { id: "rosa", name: "Rosa Cuarzo", frame: "#E2B0A8", pattern: "crystal" },
    ],
  },
  {
    id: "roma",
    name: "Roma",
    tagline: "Redondo esencial en titanio de 9 gramos.",
    description:
      "Silueta circular de perfil finísimo, inspirada en los archivos de los años 30. Tan ligera que la olvidas puesta; tan precisa que se nota de lejos.",
    category: "oftalmico",
    shape: "round",
    material: "titanio",
    price: 2390,
    badge: "Nuevo",
    blueBlockReady: true,
    specs: { lens: 49, bridge: 21, temple: 145, weight: 9, hinge: "Bisagra de titanio con tornillo antiaflojante", fit: "Angosto" },
    colors: [
      { id: "oro", name: "Oro Cepillado", frame: "#B8975A" },
      { id: "plata", name: "Plata Luna", frame: "#9DA1A4" },
      { id: "grafito", name: "Grafito", frame: "#3A3B3D" },
    ],
  },
  {
    id: "mateo",
    name: "Mateo",
    tagline: "Cuadrado arquitectónico con remaches de acero.",
    description:
      "Líneas rectas, aristas suaves y un grosor que da carácter sin pesar. El armazón que usarías en la oficina, en la cena y en la foto del pasaporte.",
    category: "oftalmico",
    shape: "square",
    material: "acetato",
    price: 1890,
    blueBlockReady: true,
    specs: { lens: 51, bridge: 20, temple: 145, weight: 24, hinge: "Bisagra flex de 5 barriles", fit: "Amplio" },
    colors: [
      { id: "carey", name: "Carey Oscuro", frame: "#3D2412", pattern: "tortoise" },
      { id: "azul", name: "Azul Medianoche", frame: "#1F2A44" },
      { id: "humo", name: "Humo Cristal", frame: "#7C7A76", pattern: "crystal" },
    ],
  },
  {
    id: "ines",
    name: "Inés",
    tagline: "Browline mixto: carácter arriba, ligereza abajo.",
    description:
      "Ceja de acetato y aro inferior de titanio. Un clásico de mediados de siglo reinterpretado con proporciones contemporáneas y plaquetas ajustables.",
    category: "oftalmico",
    shape: "square",
    material: "mixto",
    price: 2190,
    badge: "Nuevo",
    blueBlockReady: true,
    specs: { lens: 50, bridge: 20, temple: 145, weight: 15, hinge: "Bisagra metálica con resorte", fit: "Medio" },
    colors: [
      { id: "negro-oro", name: "Negro / Oro", frame: "#1A1A19", metal: "#B8975A" },
      { id: "carey-plata", name: "Carey / Plata", frame: "#5A3416", pattern: "tortoise", metal: "#A7ABAE" },
      { id: "verde-oro", name: "Verde Botella / Oro", frame: "#284034", metal: "#B8975A" },
    ],
  },
  {
    id: "costa",
    name: "Costa",
    tagline: "Aviador de doble puente con polarizado de serie.",
    description:
      "Gotas amplias, doble puente y micas polarizadas G-15 que cortan el deslumbramiento del asfalto y del mar. Para carretera, playa y ciudad.",
    category: "sol",
    shape: "aviator",
    material: "titanio",
    price: 2290,
    badge: "Best Seller",
    specs: { lens: 58, bridge: 15, temple: 140, weight: 14, hinge: "Bisagra de titanio con resorte", fit: "Amplio" },
    colors: [
      { id: "oro-verde", name: "Oro / G-15", frame: "#C2A15F", lens: "#3E4A36" },
      { id: "negro-humo", name: "Negro / Humo", frame: "#1E1E1D", lens: "#2C2C2E" },
      { id: "plata-azul", name: "Plata / Azul Espejo", frame: "#A7ABAE", lens: "#2F5C8A" },
    ],
  },
  {
    id: "tulum",
    name: "Tulum",
    tagline: "Cat-eye XL con micas degradadas.",
    description:
      "Volumen generoso y un ángulo felino que estiliza el rostro. Micas degradadas UV400 que dejan ver tu mirada mientras te protegen.",
    category: "sol",
    shape: "cateye",
    material: "acetato",
    price: 1990,
    badge: "Edición limitada",
    specs: { lens: 55, bridge: 17, temple: 145, weight: 27, hinge: "Bisagra flex de 7 barriles", fit: "Amplio" },
    colors: [
      { id: "carey", name: "Carey / Café", frame: "#5A3416", pattern: "tortoise", lens: "#5B3A24" },
      { id: "hueso", name: "Hueso / Humo", frame: "#E9E2D3", lens: "#3A3A3A" },
      { id: "cereza", name: "Cereza / Rosa", frame: "#7D1F24", lens: "#9C5A5E" },
    ],
  },
  {
    id: "brava",
    name: "Brava",
    tagline: "Cuadrado oversize. Actitud de ciudad.",
    description:
      "Frente grueso de acetato de alta densidad y micas planas que cubren de verdad. El par que convierte cualquier outfit en declaración.",
    category: "sol",
    shape: "square",
    material: "acetato",
    price: 1890,
    specs: { lens: 54, bridge: 19, temple: 145, weight: 28, hinge: "Bisagra flex de 5 barriles", fit: "Amplio" },
    colors: [
      { id: "negro", name: "Negro / Humo", frame: "#141413", lens: "#232325" },
      { id: "oliva", name: "Oliva / Verde", frame: "#4D5236", lens: "#3B4733" },
      { id: "arena", name: "Arena Cristal / Café", frame: "#CDB892", pattern: "crystal", lens: "#6A4A2E" },
    ],
  },
  {
    id: "lumen",
    name: "Lumen",
    tagline: "Redondo mixto con micas espejo.",
    description:
      "Aro de titanio, ceja de acetato y micas espejo con tratamiento hidrofóbico. Retro en la forma, técnico en cada detalle.",
    category: "sol",
    shape: "round",
    material: "mixto",
    price: 2490,
    badge: "Nuevo",
    specs: { lens: 50, bridge: 22, temple: 145, weight: 17, hinge: "Bisagra metálica con resorte", fit: "Medio" },
    colors: [
      { id: "carey-ambar", name: "Carey / Ámbar", frame: "#5A3416", pattern: "tortoise", metal: "#B8975A", lens: "#A8692A" },
      { id: "negro-humo", name: "Negro / Humo", frame: "#1A1A19", metal: "#3A3B3D", lens: "#2B2B2D" },
      { id: "hueso-violeta", name: "Hueso / Violeta Espejo", frame: "#E9E2D3", metal: "#A7ABAE", lens: "#5A4C8C" },
    ],
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
