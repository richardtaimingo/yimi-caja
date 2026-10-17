import type { GlassesPose } from "./geometry";

/**
 * Maniquí 3D ligero dibujado en canvas (sin WebGL): un busto con proporciones de adulto
 * proyectado según yaw/pitch. Devuelve la pose de los ojos para reutilizar drawGlasses().
 * Coordenadas en mm, centradas en la cabeza: X derecha, Y abajo, Z hacia la cámara.
 */

type P3 = [number, number, number];

const HEAD = { rx: 76, ry: 100, cy: 8 };
const EYES: [P3, P3] = [[-31, -2, 70], [31, -2, 70]];
const BRIDGE: P3 = [0, -12, 84];

export function drawMannequin(ctx: CanvasRenderingContext2D, w: number, h: number, yaw: number, pitch: number): GlassesPose {
  const k = (Math.min(w, h * 0.95) * 0.5) / (HEAD.rx * 2); // px por mm
  const cx = w / 2;
  const cy = h * 0.47;

  const project = ([X, Y, Z]: P3) => {
    const x1 = X * Math.cos(yaw) - Z * Math.sin(yaw);
    const z1 = X * Math.sin(yaw) + Z * Math.cos(yaw);
    const y2 = Y * Math.cos(pitch) + z1 * Math.sin(pitch);
    const z2 = -Y * Math.sin(pitch) + z1 * Math.cos(pitch);
    return { x: cx + x1 * k, y: cy + y2 * k, z: z2 };
  };

  // Fondo de estudio
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
  bg.addColorStop(0, "#3a3835");
  bg.addColorStop(1, "#151514");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const skin = "#E6DED1";
  const shade = "#BFB3A1";

  // Cuello y hombros
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(cx - 34 * k, cy + 70 * k);
  ctx.lineTo(cx + 34 * k, cy + 70 * k);
  ctx.quadraticCurveTo(cx + 38 * k, cy + 140 * k, cx + 120 * k, cy + 175 * k);
  ctx.lineTo(cx + 140 * k, h + 10);
  ctx.lineTo(cx - 140 * k, h + 10);
  ctx.lineTo(cx - 120 * k, cy + 175 * k);
  ctx.quadraticCurveTo(cx - 38 * k, cy + 140 * k, cx - 34 * k, cy + 70 * k);
  ctx.fill();

  // Orejas: detrás de la cabeza si están del lado lejano
  const ears = ([-1, 1] as const).map((side) => ({ side, p: project([side * HEAD.rx, 6, -6]) }));
  const drawEar = (p: { x: number; y: number; z: number }) => {
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 9 * k, 17 * k, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  ears.filter((e) => e.p.z < 0).forEach((e) => drawEar(e.p));

  // Cabeza con luz que se desplaza con el giro
  const lightX = cx - Math.sin(yaw) * HEAD.rx * k * 0.6 - HEAD.rx * k * 0.25;
  const lightY = cy - Math.sin(pitch) * HEAD.ry * k * 0.4 - HEAD.ry * k * 0.35;
  const g = ctx.createRadialGradient(lightX, lightY, HEAD.rx * k * 0.2, cx, cy + HEAD.cy * k, HEAD.ry * k * 1.15);
  g.addColorStop(0, "#F4EEE5");
  g.addColorStop(0.6, skin);
  g.addColorStop(1, shade);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy + HEAD.cy * k, HEAD.rx * k, HEAD.ry * k, 0, 0, Math.PI * 2);
  ctx.fill();

  ears.filter((e) => e.p.z >= 0).forEach((e) => drawEar(e.p));

  // Rasgos (sólo se dibujan si miran hacia la cámara)
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const stroke = (pts: P3[], width: number, color: string, curve = false) => {
    const pr = pts.map(project);
    if (pr.some((p) => p.z < 10)) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * k;
    ctx.beginPath();
    ctx.moveTo(pr[0].x, pr[0].y);
    if (curve && pr.length === 3) ctx.quadraticCurveTo(pr[1].x, pr[1].y, pr[2].x, pr[2].y);
    else pr.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  };

  for (const side of [-1, 1]) {
    // Ojos cerrados y cejas
    stroke([[side * 20, -1, 68], [side * 31, 3, 72], [side * 42, -1, 64]], 2.2, "#8C8072", true);
    stroke([[side * 18, -22, 80], [side * 32, -27, 78], [side * 46, -21, 70]], 3, "#A99C8A", true);
  }
  // Nariz y boca
  stroke([[0, -6, 86], [3, 26, 100], [-6, 33, 94]], 2.4, "#A99C8A");
  stroke([[-20, 56, 74], [0, 61, 82], [20, 56, 74]], 2.6, "#A3887A", true);

  // Pose de los ojos para el armazón
  const [a, b] = EYES.map(project);
  const bridge = project(BRIDGE);
  const eyeMidY = (a.y + b.y) / 2;
  return {
    x: (a.x + b.x) / 2,
    y: eyeMidY,
    ipd: 62 * k,
    roll: 0,
    yaw,
    pitch,
    bridgeOffset: eyeMidY - bridge.y,
  };
}
