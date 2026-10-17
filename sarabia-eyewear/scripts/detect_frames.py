"""Detecta los armazones en las imágenes de referencia (fondo blanco) y guarda sus cajas."""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

src_dir = Path(sys.argv[1])
out = Path(sys.argv[2])

result = {}
for name in ("2.jpg", "3.jpg"):
    img = np.asarray(Image.open(src_dir / name).convert("RGB")).astype(np.int16)
    h, w, _ = img.shape
    ink = img.min(axis=2) < 232  # todo lo que no es fondo blanco
    merged = ndimage.binary_dilation(ink, structure=np.ones((9, 15)))
    labels, n = ndimage.label(merged)
    boxes = []
    for sl in ndimage.find_objects(labels):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        bw, bh = x1 - x0, y1 - y0
        # Un armazón es ancho y de altura media; descarta textos y marcas de agua.
        if bw < 120 or bh < 35 or bw / bh < 1.6:
            continue
        boxes.append([int(x0), int(y0), int(x1), int(y1)])
    # Ordena por filas (y) y columnas (x)
    boxes.sort(key=lambda b: (round(b[1] / 40), b[0]))
    result[name] = boxes
    print(name, len(boxes))
    for b in boxes:
        print("  ", b, "w", b[2] - b[0], "h", b[3] - b[1])

out.write_text(json.dumps(result, indent=1))
