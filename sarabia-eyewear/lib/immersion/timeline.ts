/**
 * Línea de tiempo de "Inmersión": todo el estado de la escena es una función pura del avance del
 * scroll (0–1) y del reloj (sólo para el oleaje y el vaivén de las burbujas). Así la secuencia se
 * puede recorrer hacia adelante y hacia atrás cuadro por cuadro, como un video controlado por scroll.
 *
 * Unidades: 1 = alto de la pantalla. Eje y hacia arriba. La superficie del agua está en y = 0.
 */

/** Avance en el que el armazón toca el agua. */
export const IMPACT = 0.2;
/** Flotantes por partícula en el buffer: x, y, tamaño, tipo, vx, vy, alfa, semilla. */
export const STRIDE = 8;

const DROPLETS = 110;
const CLOUD = 140;
const TRAIL = 150;
const CLING = 16;
const BOKEH = 9;
export const MAX_PARTICLES = DROPLETS + CLOUD + TRAIL + CLING + BOKEH;

export const enum Kind {
  Bubble = 0,
  Droplet = 1,
  Bokeh = 2,
}

export type Scene = {
  camY: number;
  frameX: number;
  frameY: number;
  frameW: number;
  /** Alto del armazón (ancho / proporción de la foto). */
  frameH: number;
  frameRot: number;
  impactX: number;
  /** Edad del chapoteo (1 = 0.1 de avance); negativa antes del impacto. */
  splash: number;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (a: number, b: number, v: number) => {
  const u = clamp01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
/** Ventana: entra entre a→b y sale entre c→d. */
export const windowed = (p: number, a: number, b: number, c: number, d: number) => smooth(a, b, p) * (1 - smooth(c, d, p));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const DEG = Math.PI / 180;

/**
 * Ancho del armazón en unidades de escena: protagonista en móvil y 30 % del ancho en escritorio, con un
 * tope para no ampliar la foto más allá de su detalle real y dejar aire alrededor del chapoteo.
 */
export function frameWidth(aspect: number) {
  return aspect < 1 ? aspect * 0.74 : Math.min(aspect * 0.3, 0.56);
}

/** Altura inicial de la cámara: el armazón arranca centrado (un poco más abajo en vertical y en ultra ancho). */
export function defaultCameraStart(aspect: number) {
  return aspect < 1 ? 0.27 : aspect > 1.9 ? 0.25 : 0.2;
}

/** Altura del armazón (sin vaivén): flota, cae, entra al agua y se hunde frenando. */
export function frameDepth(p: number) {
  if (p < 0.1) return 0.2;
  if (p < IMPACT) {
    const u = (p - 0.1) / (IMPACT - 0.1);
    return 0.2 * (1 - u * u);
  }
  const s = p - IMPACT;
  return -(0.35 * (1 - Math.exp(-s * 9)) + 1.25 * s);
}

/** Desplazamiento lateral (sin vaivén): balanceo tras el impacto y, en escritorio, a un lado al final. */
export function frameOffsetX(p: number, aspect: number) {
  const s = p - IMPACT;
  const sway = s > 0 ? 0.035 * Math.sin(s * 6) * Math.exp(-s * 2.5) : 0;
  // Remate en escritorio: el armazón se hace a un lado para dejar espacio al nombre y los CTA
  const aside = aspect > 1.1 ? -Math.min(0.15 * aspect, 0.3) * smooth(0.7, 0.84, p) : 0;
  return sway + aside;
}

/**
 * @param photoAspect proporción ancho/alto de la foto del armazón.
 * @param cameraStart altura inicial de la cámara (ver defaultCameraStart); el componente la sube si las
 *   tarjetas del inicio llegan más abajo que el armazón.
 */
export function sceneAt(p: number, t: number, aspect: number, photoAspect: number, cameraStart = defaultCameraStart(aspect)): Scene {
  const baseW = frameWidth(aspect);
  const depth = frameDepth(p);
  const s = p - IMPACT;

  // Antes de caer levita como en el hero; el vaivén se apaga durante la caída
  const hover = 1 - smooth(0.08, 0.16, p);
  const bob = Math.sin(t * 1.15) * 0.012 * hover;

  // La cámara acompaña la caída desde que empieza: el impacto ocurre cerca del centro y el armazón se
  // queda un poco abajo del centro mientras la superficie sube y sale por arriba. En vertical sube al
  // centro al final para dejar sitio al nombre y los CTA debajo.
  const follow = smooth(0.1, 0.26, p);
  const offset = aspect < 1 ? lerp(0.04, -0.02, smooth(0.7, 0.88, p)) : 0.08;
  const camY = lerp(cameraStart, depth + offset, follow);

  let rot: number;
  if (p < IMPACT) rot = lerp(-4, -9, smooth(0.1, IMPACT, p)) + Math.sin(t * 0.8) * hover;
  else rot = -9 * Math.exp(-s * 7) + 7 * Math.sin(s * 10) * Math.exp(-s * 4) + 4 * Math.sin(t * 0.55) * smooth(0.3, 0.6, p);

  const drift = 0.006 * Math.sin(t * 0.7) * smooth(0.45, 0.8, p);

  const frameW = baseW * (1 - 0.1 * smooth(IMPACT, 0.8, p));
  return {
    camY,
    frameX: frameOffsetX(p, aspect) + drift,
    frameY: depth + bob + 0.008 * Math.sin(t * 0.9) * smooth(0.6, 0.9, p),
    frameW,
    frameH: frameW / photoAspect,
    frameRot: rot * DEG,
    impactX: 0,
    splash: s >= 0 ? s / 0.1 : -1,
  };
}

/**
 * Escribe las partículas visibles (gotas del chapoteo, nube de impacto, estela de burbujas y bokeh
 * en primer plano) y devuelve cuántas hay. Todas dependen sólo de p y t: se pueden rebobinar.
 */
export function writeParticles(out: Float32Array, p: number, t: number, aspect: number, scene: Scene) {
  const scale = frameWidth(aspect) / 0.64;
  let n = 0;
  const push = (x: number, y: number, size: number, kind: Kind, vx: number, vy: number, alpha: number, seed: number) => {
    const o = n * STRIDE;
    out[o] = x;
    out[o + 1] = y;
    out[o + 2] = size;
    out[o + 3] = kind;
    out[o + 4] = vx;
    out[o + 5] = vy;
    out[o + 6] = alpha;
    out[o + 7] = seed;
    n += 1;
  };

  const splash = scene.splash;
  const top = scene.camY + 0.56; // borde superior de la pantalla (con margen)
  const bottom = scene.camY - 0.56;

  // 1. Gotas: corona baja alrededor del cráter + gotas balísticas altas
  if (splash > 0 && splash < 3) {
    const g = 3.2;
    for (let i = 0; i < DROPLETS; i++) {
      const crown = i < 50;
      const side = rand(i, 0) < 0.5 ? -1 : 1;
      const delay = crown ? rand(i, 4) * 0.08 : 0.04 + rand(i, 4) * 0.22;
      const tau = (splash - delay) * 0.5;
      if (tau <= 0) continue;
      const angle = crown ? lerp(1.2, 1.5, rand(i, 1)) : lerp(0.95, 1.5, Math.pow(rand(i, 1), 0.7));
      const speed = (crown ? lerp(0.4, 0.8, rand(i, 2)) : lerp(0.7, 1.55, rand(i, 2))) * scale;
      // Salen por los bordes del armazón (no sobre las micas)
      const ox = scene.impactX + side * (crown ? lerp(0.82, 1.08, rand(i, 3)) : lerp(0.55, 1.15, rand(i, 3))) * scene.frameW * 0.5;
      const vx = side * Math.cos(angle) * speed * 0.55;
      const vy0 = Math.sin(angle) * speed;
      const y = vy0 * tau - 0.5 * g * tau * tau;
      if (y < 0) continue;
      const x = ox + vx * tau;
      if (y > top) continue;
      const size = (crown ? lerp(0.004, 0.011, rand(i, 5)) : lerp(0.003, 0.014, Math.pow(rand(i, 5), 2))) * scale;
      const alpha = (crown ? 0.62 : 0.9) * smooth(0, 0.04, tau) * (1 - smooth(1.6, 2.6, splash));
      push(x, y, size, Kind.Droplet, vx, vy0 - g * tau, alpha, rand(i, 6));
    }
  }

  // 2. Nube de burbujas que deja la entrada (sobre todo al cerrarse la cavidad)
  if (splash > 0) {
    for (let i = 0; i < CLOUD; i++) {
      const born = 0.05 + rand(i, 10) * 0.7;
      const a = splash - born;
      if (a <= 0) continue;
      const r = rand(i, 11);
      const y0 = -Math.pow(rand(i, 12), 1.4) * 0.3 * scale;
      const y = y0 + a * 0.06 * lerp(0.6, 1.5, r);
      const size = lerp(0.0018, 0.012, Math.pow(rand(i, 13), 3)) * scale;
      if (y > -size || y < bottom || y > top) continue;
      const x = scene.impactX + (rand(i, 14) - 0.5) * scene.frameW * 0.95 + (rand(i, 15) - 0.5) * a * 0.03 + Math.sin(t * lerp(1.6, 3.2, r) + i) * 0.003;
      const alpha = smooth(0, 0.12, a) * (1 - smooth(2.6, 4.2, a));
      if (alpha <= 0) continue;
      push(x, y, size, Kind.Bubble, 0, 0, alpha, rand(i, 16));
    }
  }

  // 3. Estela: el armazón suelta burbujas sin parar desde su borde superior y suben oscilando
  if (p > IMPACT + 0.02) {
    for (let i = 0; i < TRAIL; i++) {
      const emit = p - 0.006 - Math.pow(rand(i, 20), 1.5) * 0.3;
      if (emit < IMPACT + 0.015) continue;
      const age = p - emit;
      const r = rand(i, 21);
      const ey = frameDepth(emit) + scene.frameH * lerp(0.1, 0.45, rand(i, 23));
      const y = ey + age * lerp(0.55, 1.2, r);
      const size = lerp(0.0016, 0.0072, Math.pow(rand(i, 22), 2.4)) * scale * (1 + age * 1.2);
      if (y > -size || y < bottom || y > top) continue;
      const x =
        frameOffsetX(emit, aspect) + (rand(i, 24) - 0.5) * scene.frameW * 0.9 + Math.sin(age * 9 + i) * 0.012 + Math.sin(t * lerp(1.5, 3, r) + i * 1.7) * 0.004;
      const alpha = smooth(0, 0.012, age) * (0.55 + 0.45 * rand(i, 25)) * (1 - smooth(0.24, 0.3, age));
      push(x, y, size, Kind.Bubble, 0, 0, alpha, rand(i, 26));
    }

    // Burbujas pequeñas adheridas al armazón: tiemblan con el agua y giran con él
    const cos = Math.cos(-scene.frameRot);
    const sin = Math.sin(-scene.frameRot);
    const cling = smooth(IMPACT + 0.03, IMPACT + 0.08, p);
    for (let i = 0; i < CLING; i++) {
      const lx = (rand(i, 40) - 0.5) * scene.frameW * 0.92 + Math.sin(t * 2.3 + i) * 0.0012;
      const ly = scene.frameH * lerp(0.18, 0.46, rand(i, 41)) * (rand(i, 42) < 0.75 ? 1 : -1);
      const x = scene.frameX + lx * cos - ly * sin;
      const y = scene.frameY + lx * sin + ly * cos;
      const size = lerp(0.0012, 0.0034, Math.pow(rand(i, 43), 2)) * scale;
      push(x, y, size, Kind.Bubble, 0, 0, cling * lerp(0.5, 0.9, rand(i, 44)), rand(i, 45));
    }
  }

  // 4. Bokeh en primer plano: se mueve más rápido que la cámara (paralaje de profundidad)
  const under = smooth(0.24, 0.36, p);
  if (under > 0) {
    for (let i = 0; i < BOKEH; i++) {
      const r = rand(i, 30);
      const screenY = ((rand(i, 31) + t * lerp(0.006, 0.018, r) - scene.camY * 0.6) % 1 + 1) % 1;
      const y = scene.camY + (screenY - 0.5) * 1.3;
      if (y > -0.04) continue;
      const x = (rand(i, 32) - 0.5) * Math.max(aspect, 0.6) * 1.15;
      const size = lerp(0.018, 0.055, Math.pow(rand(i, 33), 1.5)) * Math.min(scale, 1.2);
      push(x, y, size, Kind.Bokeh, 0, 0, under * lerp(0.1, 0.28, rand(i, 34)) * smooth(-0.04, -0.14, y), rand(i, 35));
    }
  }

  return n;
}
