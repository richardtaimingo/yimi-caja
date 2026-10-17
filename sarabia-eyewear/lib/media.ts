/** Fotografías editoriales (no de producto). Se completan con fotos reales con licencia libre. */
export type EditorialPhoto = { src: string; alt: string; width: number; height: number; credit?: { author: string; url: string } };

export const media: {
  /** Fondo del panel oscuro del hero. */
  hero: EditorialPhoto | null;
} = {
  hero: null,
};
