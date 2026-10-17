export const site = {
  name: "Sarabia Eyewear",
  endorsement: "By Jennifer Sarabia",
  parent: "Ópticas Jennifer Sarabia",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarabia-eyewear.vercel.app",
  description:
    "Armazones oftálmicos y de sol de autor por Jennifer Sarabia. Acetato de alta densidad, titanio aeroespacial y micas premium. Compra y personaliza por WhatsApp.",
  /** Número de WhatsApp en formato internacional para wa.me (+52 1 55 1902 3635). */
  whatsapp: "5215519023635",
  whatsappDisplay: "+52 1 55 1902 3635",
  email: "hola@sarabiaeyewear.com",
  address: "Ópticas Jennifer Sarabia · Ciudad de México",
  hours: "Lun a Sáb · 10:00 – 20:00",
  social: {
    instagram: "https://instagram.com/opticasjennifersarabia",
    facebook: "https://facebook.com/opticasjennifersarabia",
    tiktok: "https://tiktok.com/@sarabiaeyewear",
  },
};

export const nav = [
  { href: "#catalogo", label: "Catálogo" },
  { href: "#materiales", label: "Materiales" },
  { href: "#como-funciona", label: "Cómo Funciona" },
  { href: "#contacto", label: "Contacto" },
];

/** Construye un enlace wa.me con el texto codificado automáticamente. */
export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * Mensaje estándar de compra:
 * "Hola Sarabia Eyewear, me interesa el armazón [Modelo] en color [Color] con micas [Tipo]."
 */
export function orderMessage({ model, color, lens, extra }: { model: string; color: string; lens?: string; extra?: string }) {
  const lensPart = lens ? ` con micas ${lens}` : "";
  return `Hola Sarabia Eyewear, me interesa el armazón ${model} en color ${color}${lensPart}.${extra ? ` ${extra}` : ""}`;
}

export const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
