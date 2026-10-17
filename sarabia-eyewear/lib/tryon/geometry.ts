import type { Product } from "@/lib/products";

/**
 * Geometría del probador virtual: convierte landmarks faciales en la pose del armazón
 * (posición, escala y rotación) y lo dibuja sobre un <canvas>. No depende de MediaPipe:
 * cualquier detector con la topología de 468/478 puntos de FaceMesh sirve.
 */

/** Índices de la malla facial de MediaPipe (iguales en @mediapipe/face_mesh y FaceLandmarker). */
export const LANDMARKS = {
  rightEyeOuter: 33, // ojo derecho de la persona
  rightEyeInner: 133,
  leftEyeOuter: 263,
  leftEyeInner: 362,
  noseBridge: 168, // entrecejo / parte alta del puente nasal
  noseBridgeLow: 6,
  forehead: 10,
  chin: 152,
} as const;

/** Landmark normalizado (0–1 en x/y; z con la misma escala aproximada que x). */
export type Landmark = { x: number; y: number; z: number };

/** Pose del armazón en píxeles del canvas. */
export type GlassesPose = {
  /** Punto medio entre los centros de los ojos. */
  x: number;
  y: number;
  /** Distancia interpupilar real (sin escorzo) en píxeles. */
  ipd: number;
  /** Radianes. roll: inclinación lateral · yaw: giro izquierda/derecha · pitch: arriba/abajo. */
  roll: number;
  yaw: number;
  pitch: number;
  /** Altura del puente nasal (168/6) sobre la línea de los ojos, en píxeles. */
  bridgeOffset: number;
};

/** Geometría de la imagen del armazón, en sus propias unidades (px de la foto o del SVG). */
export type FrameGeometry = {
  width: number;
  height: number;
  /** Punto medio entre los centros de las micas. */
  anchorX: number;
  anchorY: number;
  /** Altura a la que el puente del armazón se apoya en la nariz. */
  bridgeY: number;
  /** Distancia entre centros de mica. */
  lensCenterDistance: number;
};

/** Geometría de una foto recortada a partir de los centros de sus micas (0–1). */
export function geometryFromPhoto(width: number, height: number, [[x1, y1], [x2, y2]]: [[number, number], [number, number]]): FrameGeometry {
  const lensCenterDistance = Math.hypot((x2 - x1) * width, (y2 - y1) * height);
  const anchorY = ((y1 + y2) / 2) * height;
  // Misma proporción puente/centro que el SVG de referencia (11/116).
  return { width, height, anchorX: ((x1 + x2) / 2) * width, anchorY, bridgeY: anchorY - lensCenterDistance * 0.095, lensCenterDistance };
}

/** Medidas del SVG de FrameIllustration (viewBox 0 0 240 104). */
export const FRAME_SVG: FrameGeometry = {
  width: 240,
  height: 104,
  /** Punto medio entre los centros de las micas. */
  anchorX: 120,
  anchorY: 53,
  /** Altura a la que el puente del armazón se apoya en la nariz. */
  bridgeY: 42,
  /** Distancia entre centros de mica en unidades del SVG. */
  lensCenterDistance: 116,
};

/** Distancia interpupilar promedio de un adulto (mm). Sirve para convertir mm del armazón a píxeles. */
export const AVERAGE_IPD_MM = 63;

/**
 * Relación entre la distancia de centros de mica del armazón (calibre + puente) y la
 * distancia interpupilar. Así un 55□17 se ve más grande que un 49□21, como en la vida real.
 */
export function frameScale(product: Product) {
  return (product.specs.lens + product.specs.bridge) / AVERAGE_IPD_MM;
}

/** Transformación tipo object-fit para dibujar la fuente (video/foto) dentro del canvas. */
export type Fit = { scale: number; dx: number; dy: number; mirrored: boolean; canvasWidth: number };

export function computeFit(srcW: number, srcH: number, dstW: number, dstH: number, mode: "cover" | "contain", mirrored: boolean): Fit {
  const scale = mode === "cover" ? Math.max(dstW / srcW, dstH / srcH) : Math.min(dstW / srcW, dstH / srcH);
  return { scale, dx: (dstW - srcW * scale) / 2, dy: (dstH - srcH * scale) / 2, mirrored, canvasWidth: dstW };
}

export function drawSource(ctx: CanvasRenderingContext2D, source: CanvasImageSource, srcW: number, srcH: number, fit: Fit) {
  ctx.save();
  if (fit.mirrored) {
    ctx.translate(fit.canvasWidth, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, fit.dx, fit.dy, srcW * fit.scale, srcH * fit.scale);
  ctx.restore();
}

/** Landmark normalizado → píxeles del canvas (aplicando el mismo fit/espejo que la imagen). */
function toCanvas(l: Landmark, srcW: number, srcH: number, fit: Fit) {
  const x = l.x * srcW * fit.scale + fit.dx;
  return {
    x: fit.mirrored ? fit.canvasWidth - x : x,
    y: l.y * srcH * fit.scale + fit.dy,
    z: l.z * srcW * fit.scale,
  };
}

const midpoint = (a: Landmark, b: Landmark): Landmark => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Calcula la pose del armazón a partir de los landmarks:
 * - Centro de cada ojo = punto medio de sus comisuras (33/133 y 263/362).
 * - Roll: ángulo de la línea entre ojos en pantalla.
 * - Yaw: profundidad (z) relativa entre ambos ojos.
 * - Pitch: profundidad relativa entre frente (10) y mentón (152).
 * - Distancia interpupilar real: longitud 3D entre ojos (no se encoge al girar la cabeza).
 * - Puente nasal: punto medio de 168 y 6, medido sobre el eje vertical del rostro.
 */
export function poseFromLandmarks(landmarks: Landmark[], srcW: number, srcH: number, fit: Fit): GlassesPose | null {
  if (landmarks.length < 400) return null;
  const L = LANDMARKS;
  const rightEye = toCanvas(midpoint(landmarks[L.rightEyeOuter], landmarks[L.rightEyeInner]), srcW, srcH, fit);
  const leftEye = toCanvas(midpoint(landmarks[L.leftEyeOuter], landmarks[L.leftEyeInner]), srcW, srcH, fit);
  // Ojo que aparece a la izquierda de la pantalla → ojo de la derecha de la pantalla.
  const [a, b] = rightEye.x <= leftEye.x ? [rightEye, leftEye] : [leftEye, rightEye];
  const eye = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ipd = Math.hypot(eye.x, eye.y, eye.z);
  if (ipd < 8) return null;

  const forehead = toCanvas(landmarks[L.forehead], srcW, srcH, fit);
  const chin = toCanvas(landmarks[L.chin], srcW, srcH, fit);
  const face = { y: chin.y - forehead.y, z: chin.z - forehead.z };

  const eyeMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const bridge = toCanvas(midpoint(landmarks[L.noseBridge], landmarks[L.noseBridgeLow]), srcW, srcH, fit);
  // Eje "arriba" del rostro: perpendicular a la línea de los ojos.
  const eyeLen2d = Math.hypot(eye.x, eye.y);
  const up = { x: eye.y / eyeLen2d, y: -eye.x / eyeLen2d };

  return {
    x: eyeMid.x,
    y: eyeMid.y,
    ipd,
    bridgeOffset: (bridge.x - eyeMid.x) * up.x + (bridge.y - eyeMid.y) * up.y,
    roll: Math.atan2(eye.y, eye.x),
    yaw: clamp(Math.atan2(eye.z, Math.hypot(eye.x, eye.y)), -0.9, 0.9),
    pitch: clamp(Math.atan2(face.z, face.y), -0.6, 0.6),
  };
}

/** Suavizado exponencial adaptativo: estable en reposo y ágil con movimientos rápidos. */
export function smoothPose(prev: GlassesPose | null, next: GlassesPose): GlassesPose {
  if (!prev) return next;
  const motion = Math.hypot(next.x - prev.x, next.y - prev.y) / next.ipd;
  const k = clamp(0.3 + motion * 4, 0.3, 0.9);
  const lerp = (p: number, n: number) => p + (n - p) * k;
  return {
    x: lerp(prev.x, next.x),
    y: lerp(prev.y, next.y),
    ipd: lerp(prev.ipd, next.ipd),
    roll: lerp(prev.roll, next.roll),
    yaw: lerp(prev.yaw, next.yaw),
    pitch: lerp(prev.pitch, next.pitch),
    bridgeOffset: lerp(prev.bridgeOffset, next.bridgeOffset),
  };
}

/**
 * Dibuja el armazón. El frente de la montura queda ~15 mm por delante de los ojos,
 * así que al girar la cabeza se desplaza en la dirección del giro y se escorza.
 * Verticalmente se combina la línea de los ojos (centro de las micas) con el puente
 * nasal (donde se apoya el puente del armazón).
 */
export function drawGlasses(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  pose: GlassesPose,
  scale: number,
  opacity = 1,
  geom: FrameGeometry = FRAME_SVG,
) {
  const s = (pose.ipd * scale) / geom.lensCenterDistance;
  const depth = pose.ipd * 0.25;
  const width = geom.width * s;
  const bridgeShift = Number.isFinite(pose.bridgeOffset) ? 0.4 * ((geom.anchorY - geom.bridgeY) * s - pose.bridgeOffset) : 0;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(pose.x - Math.sin(pose.yaw) * depth, pose.y + Math.sin(pose.pitch) * depth);
  ctx.rotate(pose.roll);
  ctx.scale(Math.max(Math.cos(pose.yaw), 0.4), Math.max(Math.cos(pose.pitch), 0.6));
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = width * 0.03;
  ctx.shadowOffsetY = width * 0.015;
  ctx.drawImage(image, -geom.anchorX * s, -geom.anchorY * s + bridgeShift, width, geom.height * s);
  ctx.restore();
}

/** Pose manual (cuando no hay detector disponible o la foto no tiene un rostro de frente). */
export type ManualPose = { x: number; y: number; size: number; roll: number };
export const DEFAULT_MANUAL_POSE: ManualPose = { x: 0.5, y: 0.42, size: 0.2, roll: 0 };

export function poseFromManual(m: ManualPose, w: number, h: number): GlassesPose {
  const ipd = m.size * Math.min(w, h * 1.4);
  // Sin puente medido, se asume el que coincide con el SVG (sin corrección vertical).
  return { x: m.x * w, y: m.y * h, ipd, roll: m.roll, yaw: 0, pitch: 0, bridgeOffset: NaN };
}
