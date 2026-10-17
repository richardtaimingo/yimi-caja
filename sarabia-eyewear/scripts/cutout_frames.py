"""
Recorta armazones reales de las imágenes de referencia (fondo blanco) y genera:
- public/frames/<id>.webp   recorte con fondo transparente, ampliado 2x y enfocado
- public/frames/<id>-lens.png  máscara de las micas (sólo armazones con micas claras)
- frames.json  medidas, centros de mica (0–1) y cajas de mica para el sitio
Uso: python3 -I cutout_frames.py <imagenes> <public/frames> <salida.json> [--export-crops DIR] [--sr DIR] [--ts lib/framePhotos.ts]
  --export-crops DIR  guarda cada recorte sobre blanco (PNG) para ampliarlo con super-resolución
  --sr DIR            usa <DIR>/<id>.png (ampliado 4x con scripts/upscale_frames.mjs) en vez del Lanczos
  --ts FILE           escribe lib/framePhotos.ts con las medidas
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
META = Path(sys.argv[3])
FLAGS = dict(zip(sys.argv[4::2], sys.argv[5::2]))
CROPS = Path(FLAGS["--export-crops"]) if "--export-crops" in FLAGS else None
SR = Path(FLAGS["--sr"]) if "--sr" in FLAGS else None
OUT.mkdir(parents=True, exist_ok=True)

# --- Rejilla de la imagen 2 (3 columnas x 15 filas) ---
COLS = [(8, 236), (234, 459), (454, 674)]
ROW_CENTERS = [92, 166, 240, 320, 398, 470, 536, 616, 698, 771, 842, 917, 1004, 1080, 1150]
ROWS = []
for i, c in enumerate(ROW_CENTERS):
    top = 40 if i == 0 else (ROW_CENTERS[i - 1] + c) // 2
    bottom = 1198 if i == len(ROW_CENTERS) - 1 else (c + ROW_CENTERS[i + 1]) // 2
    ROWS.append((top, bottom))

# --- Cajas de la imagen 3 (detectadas) ---
IMG3 = {
    "dollger": (17, 247, 324, 325),
    "joopin": (395, 253, 684, 348),
    "sojos_aviator": (387, 402, 696, 509),
    "guvivi": (21, 564, 322, 656),
    "hycredi": (401, 558, 683, 670),
    "mosanana": (18, 740, 331, 826),
    "butaby": (386, 757, 693, 848),
}

# id de foto -> origen. Sólo armazones sin logotipos de otras marcas visibles.
SELECTION = {
    "roma-oro-g15": ("2", 1, 1),
    "roma-oro-cafe": ("2", 1, 2),
    "roma-vino-cafe": ("2", 3, 2),
    "tulum-oro-verde": ("2", 2, 1),
    "tulum-negro-oro": ("2", 2, 2),
    "mateo-carey": ("2", 4, 2),
    "mateo-negro": ("2", 4, 3),
    "valeria-verde": ("2", 6, 1),
    "costa-carey-g15": ("2", 7, 1),
    "costa-negro-humo": ("2", 7, 3),
    "costa-carey-degradado": ("3", "sojos_aviator"),
    "olivia-negro-humo": ("3", "mosanana"),
    "olivia-carey-cafe": ("2", 10, 2),
    "olivia-cafe": ("3", "guvivi"),
    "gata-negro": ("3", "joopin"),
    "gata-carey": ("2", 12, 2),
    "brava-carey": ("3", "butaby"),
    "brava-negro-g15": ("2", 12, 1),
    "brava-miel": ("2", 9, 2),
    "lince-oro-humo": ("3", "dollger"),
    "lince-negro-humo": ("2", 3, 3),
    "luna-carey-oro": ("2", 14, 1),
    "andes-negro": ("2", 8, 1),
}

images = {k: np.asarray(Image.open(SRC / f"{k}.jpg").convert("RGB")) for k in ("2", "3")}


def crop_box(spec):
    if spec[0] == "2":
        _, r, c = spec
        x0, x1 = COLS[c - 1]
        y0, y1 = ROWS[r - 1]
        return "2", (x0, y0, x1, y1), True
    _, key = spec
    return "3", IMG3[key], False


def tight_main_component(rgb):
    """Recorta a la componente principal (descarta pedazos de armazones vecinos en la rejilla)."""
    ink = rgb.min(axis=2) < 232
    merged = ndimage.binary_dilation(ink, structure=np.ones((7, 11)))
    labels, n = ndimage.label(merged)
    if n == 0:
        return rgb
    sizes = ndimage.sum(ink, labels, range(1, n + 1))
    main = int(np.argmax(sizes)) + 1
    ys, xs = np.where(labels == main)
    pad = 4
    y0, y1 = max(0, ys.min() - pad), min(rgb.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(rgb.shape[1], xs.max() + pad + 1)
    region = rgb[y0:y1, x0:x1].copy()
    # Blanquea lo que no pertenece a la componente principal
    keep = (labels == main)[y0:y1, x0:x1]
    region[~keep] = 255
    return region


def hull_mask(region, shape):
    """Polígono convexo que envuelve una región (la mica completa aunque una varilla la cruce)."""
    from scipy.spatial import ConvexHull
    from PIL import ImageDraw

    ys, xs = np.where(region)
    pts = np.column_stack([xs, ys])
    hull = ConvexHull(pts)
    poly = [tuple(map(float, pts[v])) for v in hull.vertices]
    im = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon(poly, fill=255)
    return np.asarray(im) > 0


def cutout(rgb, band=4):
    rgb = rgb.astype(np.float32)
    h, w, _ = rgb.shape
    L = rgb.min(axis=2)
    spread = rgb.max(axis=2) - L
    # Fondo: blanco conectado al borde
    white = (L >= 226) & (spread < 28)
    labels, n = ndimage.label(white)
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    transparent = np.isin(labels, list(border))
    # Áreas blancas cerradas: micas claras (también los pedazos que deja una varilla) y huecos
    enclosed = []
    for i in range(1, n + 1):
        if i in border:
            continue
        region = labels == i
        enclosed.append((region.sum(), region))
    has_clear_lenses = any(a > 0.03 * h * w for a, _ in enclosed)
    min_area = 0.0008 if has_clear_lenses else 0.006
    holes = [(a, r) for a, r in enclosed if a > min_area * h * w]
    for _, r in holes:
        transparent |= r

    # Mate en la franja de transición: cada píxel es una mezcla del armazón con el blanco del fondo,
    # alfa = (255 - L) / (255 - L_armazón), con L_armazón el tono más oscuro de la misma orilla
    # (sin entrar a la mica oscura, que volvería translúcido un aro dorado delgado).
    near = ndimage.binary_dilation(transparent, iterations=band) & ~transparent
    depth = ndimage.distance_transform_edt(~transparent)
    rim = ~transparent & (depth <= band + 1)
    local = ndimage.grey_erosion(np.where(rim, L, 255.0), size=(2 * band + 1, 2 * band + 1))
    matte = np.clip((255.0 - L) / np.maximum(255.0 - local, 60.0), 0.0, 1.0)
    # El metal dorado y el carey tienen color propio; la mezcla gris con el fondo, no.
    matte = np.maximum(matte, np.clip((spread - 24.0) / 36.0, 0.0, 1.0))
    alpha = np.where(transparent, 0.0, np.where(near, matte, 1.0))
    alpha = np.minimum(ndimage.gaussian_filter(alpha, 0.6), np.where(transparent, 0.0, 1.0))
    alpha[alpha < 0.03] = 0.0
    # Color sin el blanco: des-multiplica; con alfa bajo (ruidoso) usa el color sólido más cercano
    color = rgb.copy()
    solid = (alpha >= 0.98) & ~near
    if solid.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
        a = np.maximum(alpha, 1e-3)[..., None]
        unmul = np.clip((rgb - 255.0 * (1.0 - a)) / a, 0, 255)
        mix = np.clip((alpha - 0.2) / 0.5, 0.0, 1.0)[..., None]
        fixed = mix * unmul + (1.0 - mix) * rgb[iy, ix]
        color[near] = fixed[near]
    rgba = np.dstack([color, alpha * 255.0]).astype(np.uint8)

    # Micas claras: une los huecos de cada lado (una varilla puede partir la mica) y toma su envolvente
    lens_regions = []
    big_holes = [r for a, r in holes if a > 0.0008 * h * w] if has_clear_lenses else []
    if big_holes:
        left = np.zeros((h, w), bool)
        right = np.zeros((h, w), bool)
        for r in big_holes:
            ys, xs = np.where(r)
            (left if xs.mean() < w / 2 else right).__ior__(r)
        if left.sum() > 0.04 * h * w and right.sum() > 0.04 * h * w:
            lens_regions = [hull_mask(left, (h, w)), hull_mask(right, (h, w))]
    return rgba, lens_regions


def lens_geometry(rgba, lens_regions):
    h, w = rgba.shape[:2]
    if lens_regions:
        boxes = []
        for region in lens_regions:
            ys, xs = np.where(region)
            boxes.append((xs.min() / w, ys.min() / h, xs.max() / w, ys.max() / h, xs.mean() / w, ys.mean() / h))
        boxes.sort(key=lambda b: b[4])
        centers = [[round(b[4], 4), round(b[5], 4)] for b in boxes]
        return centers, [[round(v, 4) for v in b[:4]] for b in boxes]
    # Micas oscuras: cobertura por columna; las micas son los tramos más llenos a cada lado del puente
    alpha = rgba[..., 3] / 255.0
    cover = alpha.sum(axis=0)
    centers, boxes = [], []
    for lo, hi in ((0, w // 2), (w // 2, w)):
        seg = cover[lo:hi]
        cols = np.where(seg > 0.6 * seg.max())[0] + lo
        cx = cols.mean()
        rows_alpha = alpha[:, cols.min():cols.max() + 1].sum(axis=1)
        rows = np.where(rows_alpha > 0.35 * rows_alpha.max())[0]
        cy = (rows.min() + rows.max()) / 2
        centers.append([round(cx / w, 4), round(cy / h, 4)])
        boxes.append([round(cols.min() / w, 4), round(rows.min() / h, 4), round(cols.max() / w, 4), round(rows.max() / h, 4)])
    return centers, boxes


def upscale_rgb(rgb, factor):
    """Amplía la foto sobre su fondo blanco ANTES de recortar: bordes suaves y sin bloques JPEG."""
    im = Image.fromarray(rgb, "RGB")
    w, h = im.size
    im = im.resize((w * 2, h * 2), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.7))
    im = im.resize((w * factor, h * factor), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
    return np.asarray(im)


def super_resolved(pid):
    """Ampliación ESRGAN 4x: limpia los bloques JPEG y recupera textura del carey y los remaches."""
    im = Image.open(SR / f"{pid}.png").convert("RGB")
    return np.asarray(im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=35, threshold=3)))


meta = {}
if CROPS:
    CROPS.mkdir(parents=True, exist_ok=True)
for pid, spec in SELECTION.items():
    key, (x0, y0, x1, y1), grid = crop_box(spec)
    region = images[key][y0:y1, x0:x1]
    region = tight_main_component(region)
    if CROPS:
        Image.fromarray(region, "RGB").save(CROPS / f"{pid}.png")
        continue
    if SR and (SR / f"{pid}.png").exists():
        region, band = super_resolved(pid), 6
    else:
        region, band = upscale_rgb(region, 3 if region.shape[1] < 250 else 2), 4
    rgba, lens_regions = cutout(region, band)
    centers, boxes = lens_geometry(rgba, lens_regions)
    big = Image.fromarray(rgba, "RGBA")
    big.save(OUT / f"{pid}.webp", "WEBP", quality=92, method=6)
    entry = {"width": big.width, "height": big.height, "lensCenters": centers, "lensBoxes": boxes, "clearLenses": bool(lens_regions)}
    if lens_regions:
        lens = np.zeros(rgba.shape[:2], dtype=bool)
        for r in lens_regions:
            lens |= r
        mask = ndimage.binary_dilation(lens, iterations=2).astype(np.uint8) * 255
        # Máscara para CSS mask-image: blanco con la mica en el canal alfa (borde suave)
        alpha_img = Image.fromarray(mask, "L").filter(ImageFilter.GaussianBlur(2))
        lens_png = Image.new("RGBA", alpha_img.size, (255, 255, 255, 0))
        lens_png.putalpha(alpha_img)
        lens_png.save(OUT / f"{pid}-lens.png", optimize=True)
        entry["lensMask"] = f"/frames/{pid}-lens.png"
        # Versión para el probador: sin las varillas que se ven a través de la mica clara
        inner = ndimage.binary_erosion(lens, iterations=5)
        tryon = rgba.copy()
        tryon[inner, 3] = 0
        Image.fromarray(tryon, "RGBA").save(OUT / f"{pid}-tryon.webp", "WEBP", quality=92, method=6)
        entry["tryOn"] = f"/frames/{pid}-tryon.webp"
    meta[pid] = entry
    print(f"{pid:24s} {big.width}x{big.height} clear={entry['clearLenses']} centers={centers}")

def ts_entry(pid, e):
    pair = lambda pts: "[" + ", ".join(f"[{round(float(x), 3)}, {round(float(y), 3)}]" for x, y in pts) + "]"
    fields = [f'front: "/frames/{pid}.webp"', f"width: {e['width']}", f"height: {e['height']}", f"lensCenters: {pair(e['lensCenters'])}"]
    if e["clearLenses"]:
        boxes = "[" + ", ".join("[" + ", ".join(str(round(float(v), 3)) for v in b) + "]" for b in e["lensBoxes"]) + "]"
        fields += [f'tryOn: "{e["tryOn"]}"', f'lensMask: "{e["lensMask"]}"', f"lensBoxes: {boxes}"]
    return f'  "{pid}": {{{", ".join(fields)}}},'


if not CROPS:
    META.write_text(json.dumps(meta, indent=1))
    if "--ts" in FLAGS:
        Path(FLAGS["--ts"]).write_text(
            'import type { ProductPhoto } from "./products";\n\n'
            "// Generado por scripts/cutout_frames.py a partir de las fotos de referencia.\n"
            "// Medidas en px de cada WebP; centros y cajas de mica normalizados (0–1).\n"
            "export const framePhotos: Record<string, ProductPhoto> = {\n"
            + "\n".join(ts_entry(pid, e) for pid, e in meta.items())
            + "\n};\n"
        )
