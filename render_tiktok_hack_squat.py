#!/usr/bin/env python3
"""
Render TikTok "Dark Gymtok" — Hack Squat
=========================================
Uso:
    python3 render_tiktok_hack_squat.py [video_entrada.mp4] [-o tiktok_hack_squat_viral.mp4]

Si no se pasa la entrada, busca un .mp4 en la carpeta actual (si hay varios, pide elegir).

Pipeline (un solo pase de ffmpeg, sin recodificaciones intermedias):
  1. Recorte exacto por cuadro 00:01.00 -> 00:17.50 (16.5 s).
  2. Hook visual: zoom 100% -> 112% en 1.5 s (ease-out), con precisión de subpíxel (filtro
     `perspective`, sin el temblor típico de zoompan/crop). Regresa a 100% durante el destello
     blanco de transición que trae el clip (1.53-1.70 s), así el reset queda oculto.
  3. Color "Dark Gymtok": eq (contraste 1.15, brillo -0.04, saturación 0.88) + unsharp + viñeta suave.
  4. Textos: se renderizan con Pillow (fuente detectada en el sistema, sin rutas escapadas en
     drawtext) como PNG con caja negra al 75% y se superponen por bloque con cortes exactos al cuadro.
  5. Exportación: H.264 High, CRF 18, yuv420p, mismos fps del original, AAC 192 kbps, faststart.
"""

import argparse
import glob
import json
import os
import platform
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont, features

# ───────────────────────────── CONFIGURACIÓN ─────────────────────────────
TRIM_START = 1.00          # s en el video original
TRIM_END = 17.50           # s en el video original

ZOOM_MAX = 1.12            # 112 %
ZOOM_IN_END = 1.50         # s (timeline nuevo): fin del push-in
ZOOM_OUT_END = 1.70        # s: vuelve a 100 % durante el destello blanco del clip original
ZOOM_ANCHOR = (0.53, 0.20) # punto fijo del zoom (x, y relativos): frente/cara -> la cara crece
                           # hacia abajo y no se mete bajo los textos

GRADE = dict(contrast=1.15, brightness=-0.04, saturation=0.88)
UNSHARP = "unsharp=lx=5:ly=5:la=0.75:cx=5:cy=5:ca=0"   # nitidez solo en luma (sin ruido de color)
VIGNETTE = "vignette=angle=PI/6"                        # suave (PI/5 es el default, más fuerte)

# Textos (tiempos en el timeline nuevo). Cada línea = lista de (texto, color).
WHITE, YELLOW, RED, GREEN = "#FFFFFF", "#FFD60A", "#FF3B30", "#30E36B"
BLOCKS = [
    # Bloques 2 y 3 sincronizados con la acción real del clip:
    # brazo al poste desde ~3.3 s, ambas manos en los seguros desde ~9.0 s.
    (0.0, 3.3, [[("Deja de hacer la Hack Squat así", WHITE)],
                [("si quieres crecer tus cuádriceps", YELLOW)]]),
    (3.3, 9.0, [[("ERROR:", RED), (" Agarrarte del marco", WHITE)],
                [("te quita estabilidad en la cadera", WHITE)]]),
    (9.0, 13.8, [[("MEJOR:", GREEN), (" Sujétate de los seguros", WHITE)],
                 [("pega la espalda y baja profundo", WHITE)]]),
    (13.8, 16.5, [[("Guárdalo para tu día de pierna", YELLOW)],
                  [("y sígueme para entrenar pesado", WHITE)]]),
]
TEXT_TOP = 0.14            # tope de la primera línea (fracción de la altura)
BOX_ALPHA = 0.75           # boxcolor=black@0.75
BOX_PAD_Y = 14             # boxborderw=14
BOX_PAD_X = 22             # un poco más de aire lateral, estilo caption nativo de TikTok
BOX_RADIUS = 12
LINE_GAP = 8               # separación entre las dos cajas
SAFE_MARGIN_X = 64         # margen lateral mínimo de cada caja
FONT_SIZE_MAX = 52
FONT_SIZE_MIN = 34

# Fuentes limpias y gruesas, en orden de preferencia (nombre de archivo, índice TTC).
FONT_PREFERENCE = [
    "Montserrat-ExtraBold.ttf", "Montserrat-Black.ttf", "Montserrat-Bold.ttf",
    "Inter-ExtraBold.otf", "Inter-ExtraBold.ttf", "Inter-Black.otf", "Inter-Bold.otf", "Inter-Bold.ttf",
    "Poppins-ExtraBold.ttf", "Poppins-Bold.ttf",
    "arialbd.ttf", "Arial Bold.ttf", "Arial-BoldMT.ttf",
    "HelveticaNeue-Bold.ttf", "Helvetica-Bold.ttf",
    "impact.ttf", "Impact.ttf",
    "LiberationSans-Bold.ttf", "DejaVuSans-Bold.ttf", "FreeSansBold.ttf",
]


def log(msg):
    print(f"[render] {msg}", flush=True)


# ───────────────────────────── utilidades ─────────────────────────────
def require_tools():
    missing = [t for t in ("ffmpeg", "ffprobe") if shutil.which(t) is None]
    if missing:
        sys.exit(f"Falta {', '.join(missing)} en el PATH. Instálalo (https://ffmpeg.org) y reintenta.")
    out = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
    need = ["perspective", "eq", "unsharp", "vignette", "overlay", "trim", "atrim", "afade"]
    lacking = [f for f in need if f" {f} " not in out]
    if lacking:
        sys.exit(f"Tu ffmpeg no trae los filtros: {lacking}")
    enc = subprocess.run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
    if "libx264" not in enc:
        sys.exit("Tu ffmpeg no tiene libx264.")
    ver = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True).stdout.splitlines()[0]
    log(f"ffmpeg OK -> {ver}")


def find_input(cli_path, output_name):
    if cli_path:
        if not os.path.isfile(cli_path):
            sys.exit(f"No existe: {cli_path}")
        return cli_path
    cands = [f for f in glob.glob("*.mp4") + glob.glob("*.MP4")
             if os.path.basename(f) != os.path.basename(output_name)]
    if len(cands) == 1:
        return cands[0]
    if not cands:
        sys.exit("No encontré ningún .mp4 en la carpeta actual. Pásame la ruta como argumento.")
    sys.exit("Hay varios .mp4, dime cuál usar:\n  " + "\n  ".join(cands))


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path],
                       capture_output=True, text=True, check=True)
    info = json.loads(r.stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    num, den = map(int, v["r_frame_rate"].split("/"))
    fps = round(num / den, 3)
    rot = 0
    for sd in v.get("side_data_list", []):
        rot = int(sd.get("rotation", 0) or 0)
    return dict(w=int(v["width"]), h=int(v["height"]), fps=fps, rot=rot,
                duration=float(info["format"]["duration"]),
                sr=int(a["sample_rate"]) if a else None, has_audio=a is not None,
                color=(v.get("color_primaries"), v.get("color_transfer"), v.get("color_space")))


def font_dirs():
    home = os.path.expanduser("~")
    sysname = platform.system()
    if sysname == "Windows":
        windir = os.environ.get("WINDIR", r"C:\Windows")
        return [os.path.join(windir, "Fonts"),
                os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Windows", "Fonts")]
    if sysname == "Darwin":
        return ["/System/Library/Fonts", "/System/Library/Fonts/Supplemental", "/Library/Fonts",
                os.path.join(home, "Library", "Fonts")]
    return ["/usr/share/fonts", "/usr/local/share/fonts", os.path.join(home, ".fonts"),
            os.path.join(home, ".local", "share", "fonts")]


def font_supports(font, chars="áéíóúñÁÉ¿¡"):
    """Detecta si la fuente dibuja los acentos (vs. el recuadro .notdef)."""
    def sig(c):
        im = Image.new("L", (120, 120), 0)
        ImageDraw.Draw(im).text((20, 10), c, font=font, fill=255)
        return im.tobytes()
    missing = sig("\U0010FFFD")
    return all(sig(c) != missing for c in chars)


def pick_font():
    index = {}
    for d in font_dirs():
        if not os.path.isdir(d):
            continue
        for p in glob.glob(os.path.join(d, "**", "*.[ot]tf"), recursive=True):
            index.setdefault(os.path.basename(p).lower(), p)
    found = [n for n in FONT_PREFERENCE if n.lower() in index]
    log("Fuentes gruesas instaladas: " + (", ".join(found) if found else "ninguna de la lista"))
    tried = [index[n.lower()] for n in found]
    if shutil.which("fc-match"):  # último recurso en Linux/macOS con fontconfig
        for q in ("Montserrat:style=ExtraBold", "Inter:style=ExtraBold", "Arial:style=Bold", "sans-serif:bold"):
            p = subprocess.run(["fc-match", "-f", "%{file}", q], capture_output=True, text=True).stdout.strip()
            if p and p not in tried:
                tried.append(p)
    for path in tried:
        try:
            f = ImageFont.truetype(path, 48)
        except OSError:
            continue
        if font_supports(f):
            log(f"Fuente elegida: {path}")
            return path
    sys.exit("No encontré una fuente bold con acentos. Instala Montserrat o Inter (Google Fonts).")


# ───────────────────────────── textos ─────────────────────────────
def load_font(path, size):
    engine = ImageFont.Layout.RAQM if features.check("raqm") else ImageFont.Layout.BASIC
    return ImageFont.truetype(path, size, layout_engine=engine)


def fit_font_size(path, frame_w):
    max_text_w = frame_w - 2 * SAFE_MARGIN_X - 2 * BOX_PAD_X
    lines = ["".join(t for t, _ in line) for _, _, blk in BLOCKS for line in blk]
    for size in range(FONT_SIZE_MAX, FONT_SIZE_MIN - 1, -1):
        f = load_font(path, size)
        widest = max(f.getbbox(s, anchor="ls")[2] - f.getbbox(s, anchor="ls")[0] for s in lines)
        if widest <= max_text_w:
            log(f"Tamaño de fuente: {size}px (línea más ancha {widest}px de {max_text_w}px disponibles)")
            return size
    return FONT_SIZE_MIN


def render_block_png(lines, font_path, size, frame_w, frame_h, out_path):
    """Dibuja un bloque de 2 líneas (cajas unidas en una sola máscara, sin zonas dobles)."""
    font = load_font(font_path, size)
    # Métrica común para que todas las cajas tengan la misma altura (con o sin acentos/descendentes).
    asc = -font.getbbox("ÁÉHdáéíl", anchor="ls")[1]
    desc = font.getbbox("gjpqy,", anchor="ls")[3]
    box_h = asc + desc + 2 * BOX_PAD_Y

    ss = 4  # supersampling para bordes redondeados suaves
    mask = Image.new("L", (frame_w * ss, frame_h * ss), 0)
    md = ImageDraw.Draw(mask)
    layout = []
    box_top = round(frame_h * TEXT_TOP) - BOX_PAD_Y
    for segs in lines:
        full = "".join(t for t, _ in segs)
        l, _, r, _ = font.getbbox(full, anchor="ls")
        ink_w = r - l
        x0 = (frame_w - ink_w) / 2 - l           # origen de la pluma para centrar la tinta
        baseline = box_top + BOX_PAD_Y + asc
        bx0, bx1 = x0 + l - BOX_PAD_X, x0 + r + BOX_PAD_X
        md.rounded_rectangle([bx0 * ss, box_top * ss, bx1 * ss, (box_top + box_h) * ss],
                             radius=BOX_RADIUS * ss, fill=255)
        layout.append((x0, baseline, segs))
        box_top += box_h + LINE_GAP
    mask = mask.resize((frame_w, frame_h), Image.LANCZOS)

    img = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    img.putalpha(mask.point(lambda v: round(v * BOX_ALPHA)))
    d = ImageDraw.Draw(img)
    for x, baseline, segs in layout:
        for text, color in segs:
            d.text((x, baseline), text, font=font, fill=color, anchor="ls")
            x += font.getlength(text)

    bbox = img.getbbox()
    crop = img.crop(bbox)
    crop.save(out_path)
    return bbox[0], bbox[1]


# ───────────────────────────── filtro ffmpeg ─────────────────────────────
def zoom_expr(fps):
    t = f"((in-1)/{fps})"  # 'in' de perspective empieza en 1
    q = f"clip(({t}-{ZOOM_IN_END})/{ZOOM_OUT_END - ZOOM_IN_END},0,1)"
    zin = f"(1+{ZOOM_MAX - 1:.4f}*(1-pow(1-{t}/{ZOOM_IN_END},3)))"           # ease-out cubic
    zout = f"({ZOOM_MAX}-{ZOOM_MAX - 1:.4f}*{q}*{q}*(3-2*{q}))"              # smoothstep
    return f"if(lt({t},{ZOOM_IN_END}),{zin},if(lt({t},{ZOOM_OUT_END}),{zout},1))"


def perspective_filter(fps):
    z = zoom_expr(fps)
    ax, ay = ZOOM_ANCHOR
    ox = f"({ax}*W*(1-1/({z})))"
    oy = f"({ay}*H*(1-1/({z})))"
    x_r = f"({ox}+W/({z}))"
    y_b = f"({oy}+H/({z}))"
    return (f"perspective=x0='{ox}':y0='{oy}':x1='{x_r}':y1='{oy}':"
            f"x2='{ox}':y2='{y_b}':x3='{x_r}':y3='{y_b}':interpolation=cubic:eval=frame")


def build_filtergraph(meta, overlays):
    fps = meta["fps"]
    half = 0.5 / fps  # cortes a medio cuadro => selección exacta por cuadro, sin errores de redondeo
    g = GRADE
    chain = [
        f"[0:v]trim=start={TRIM_START - half:.6f}:end={TRIM_END - half:.6f}",
        "setpts=PTS-STARTPTS",
        perspective_filter(fps),
        f"eq=contrast={g['contrast']}:brightness={g['brightness']}:saturation={g['saturation']}",
        UNSHARP,
        VIGNETTE + "[base]",
    ]
    parts = [",".join(chain)]
    prev = "base"
    for i, (x, y, start, end) in enumerate(overlays, start=1):
        a = max(0.0, start - half)
        b = end - half if end < TRIM_END - TRIM_START - 1e-6 else 1e9
        parts.append(f"[{prev}][{i}:v]overlay=x={x}:y={y}:eof_action=repeat:"
                     f"enable='gte(t,{a:.6f})*lt(t,{b:.6f})'[v{i}]")
        prev = f"v{i}"
    parts.append(f"[{prev}]format=yuv420p[vout]")

    if meta["has_audio"]:
        sr = meta["sr"]
        dur = TRIM_END - TRIM_START
        parts.append(
            f"[0:a]atrim=start_sample={round(TRIM_START * sr)}:end_sample={round(TRIM_END * sr)},"
            f"asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={dur - 0.03:.3f}:d=0.03[aout]")
    return ";".join(parts)


# ───────────────────────────── main ─────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", nargs="?")
    ap.add_argument("-o", "--output", default="tiktok_hack_squat_viral.mp4")
    args = ap.parse_args()

    require_tools()
    src = find_input(args.input, args.output)
    meta = probe(src)
    log(f"Entrada: {src} | {meta['w']}x{meta['h']} @ {meta['fps']} fps | {meta['duration']:.2f} s | "
        f"audio={'sí' if meta['has_audio'] else 'no'}")
    if meta["rot"]:
        log(f"Aviso: el video trae rotación {meta['rot']}°, ffmpeg la aplica automáticamente.")
    if meta["duration"] + 0.05 < TRIM_END:
        sys.exit(f"El video dura {meta['duration']:.2f}s, menos que el corte final {TRIM_END}s.")

    W, H = (meta["h"], meta["w"]) if abs(meta["rot"]) in (90, 270) else (meta["w"], meta["h"])
    font_path = pick_font()
    size = fit_font_size(font_path, W)

    tmp = tempfile.mkdtemp(prefix="tiktok_text_")
    overlays, inputs = [], []
    for i, (start, end, lines) in enumerate(BLOCKS, start=1):
        png = os.path.join(tmp, f"bloque_{i}.png")
        x, y = render_block_png(lines, font_path, size, W, H, png)
        overlays.append((x, y, start, end))
        inputs += ["-i", png]
    log(f"Textos renderizados en {tmp}")

    fg = build_filtergraph(meta, overlays)
    fps = meta["fps"]
    cmd = ["ffmpeg", "-hide_banner", "-y", "-i", src, *inputs,
           "-filter_complex", fg, "-map", "[vout]"]
    if meta["has_audio"]:
        cmd += ["-map", "[aout]", "-c:a", "aac", "-b:a", "192k", "-ar", str(meta["sr"]), "-ac", "2"]
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high",
            "-pix_fmt", "yuv420p", "-r", f"{fps:g}", "-fps_mode", "cfr", "-g", str(round(fps * 2)),
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
            "-map_metadata", "-1", "-movflags", "+faststart", args.output]

    with open(os.path.splitext(args.output)[0] + "_ffmpeg_cmd.txt", "w", encoding="utf-8") as fh:
        fh.write(" ".join(f'"{c}"' if any(ch in c for ch in " ;'[]") else c for c in cmd) + "\n")
    log("Renderizando…")
    subprocess.run(cmd, check=True)

    out = probe(args.output)
    exp_frames = round((TRIM_END - TRIM_START) * fps)
    nb = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-count_packets",
                         "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", args.output],
                        capture_output=True, text=True).stdout.strip()
    size_mb = os.path.getsize(args.output) / 1e6
    log(f"LISTO -> {args.output} | {out['w']}x{out['h']} @ {out['fps']} fps | {out['duration']:.3f} s | "
        f"{nb} cuadros (esperados {exp_frames}) | {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
