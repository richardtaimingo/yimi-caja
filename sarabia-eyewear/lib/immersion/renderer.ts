import { MAX_PARTICLES, STRIDE, type Scene } from "./timeline";

/**
 * Render en tiempo real de "Inmersión" con WebGL2 (sin dependencias):
 * - Pasada 1 (pantalla completa): aire, superficie con oleaje y ondas del impacto, agua con rayos de
 *   luz, cáusticas y partículas en suspensión, cavidad de aire y el armazón real (foto) con refracción,
 *   absorción del agua y luz cenital sobre los bordes.
 * - Pasada 2 (instanciada): gotas, burbujas y bokeh.
 * Se dibuja a la resolución nativa de la pantalla (hasta 2x), así que se ve nítido en Retina.
 */

const FULLSCREEN_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const SCENE_FS = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uCamY;
uniform vec4 uFrame;      // x, y, ancho, giro (rad, mismo sentido que CSS)
uniform float uFrameAspect;
uniform vec4 uImpact;     // x, edad del chapoteo, apertura de la cavidad, estrangulamiento
uniform float uFade;
uniform float uHasTex;
uniform sampler2D uTex;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  return 0.55 * noise(p) + 0.3 * noise(p * 2.03 + 7.1) + 0.15 * noise(p * 4.01 + 3.3);
}

// Cáusticas: red de Voronoi deformada (filamentos curvos de luz) modulada por ruido suave
float caustic(vec2 p, float t) {
  p += 0.42 * vec2(sin(p.y * 1.7 + t * 0.6), cos(p.x * 1.3 - t * 0.5));
  vec2 n = floor(p), f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = 0.5 + 0.45 * sin(t + 6.2831 * hash2(n + g));
      float d = length(g + o - f);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
    }
  }
  float line = 1.0 - smoothstep(0.0, 0.16, f2 - f1);
  return line * line * (0.35 + 0.65 * noise(p * 0.6 + t * 0.2));
}

float rays(vec2 wp, float t) {
  float x = wp.x + wp.y * 0.22;
  float r = 0.5 + 0.5 * sin(x * 9.0 + t * 0.21);
  r *= 0.5 + 0.5 * sin(x * 21.0 - t * 0.33 + 1.7);
  r += 0.35 * (0.5 + 0.5 * sin(x * 4.0 + t * 0.12 + 0.4));
  return r * r;
}

float snow(vec2 wp, float scale, float t) {
  vec2 g = wp * scale + vec2(0.0, -t * 0.15);
  vec2 id = floor(g);
  if (hash(id) > 0.16) return 0.0;
  vec2 f = fract(g) - 0.5;
  vec2 o = (hash2(id * 1.7) - 0.5) * 0.7;
  return smoothstep(0.09, 0.0, length(f - o)) * (0.35 + 0.65 * hash(id + 3.1));
}

float surfaceH(float x) {
  float t = uTime;
  float fw = uFrame.z;
  float h = 0.0032 * sin(x * 7.0 + t * 1.1) + 0.002 * sin(x * 17.0 - t * 1.7) + 0.001 * sin(x * 41.0 + t * 2.9);
  float age = uImpact.y;
  if (age > 0.0) {
    float d = abs(x - uImpact.x);
    float front = fw * 0.5 + age * 0.3;
    float env = exp(-age * 1.3);
    h += env * 0.028 * sin((d - front) * 30.0) * exp(-abs(d - front) * 5.0) * smoothstep(front + 0.06, front - 0.3, d);
    float crater = fw * 0.42;
    h -= 0.05 * exp(-pow(d / crater, 2.0)) * smoothstep(0.0, 0.05, age) * exp(-age * 2.6);
    h += 0.022 * exp(-pow((d - crater * 1.25) / (crater * 0.35), 2.0)) * smoothstep(0.0, 0.08, age) * exp(-age * 1.8);
  }
  return h;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float px = 1.0 / uRes.y;
  vec2 wp = vec2(p.x, p.y + uCamY);
  float t = uTime;
  float fw = uFrame.z;
  float sd = wp.y - surfaceH(wp.x);           // > 0 aire · < 0 agua
  float water = 1.0 - smoothstep(-px, px, sd);
  float D = max(-wp.y, 0.0);

  // Aire: tinta arriba, luz cobalto al acercarse al agua y halo de estudio detrás del armazón
  vec3 air = mix(vec3(0.05, 0.11, 0.33), vec3(0.012, 0.02, 0.043), smoothstep(0.0, 0.7, sd));
  vec2 kd = (wp - uFrame.xy) * vec2(0.85, 1.5);
  air += vec3(0.10, 0.20, 0.58) * exp(-dot(kd, kd) * 7.0) * 0.9;
  air += vec3(0.16, 0.30, 0.80) * exp(-max(sd, 0.0) / 0.035) * 0.22;

  // Agua: cobalto luminoso bajo la superficie que se apaga con la profundidad (nunca negro)
  vec3 wcol = mix(vec3(0.14, 0.34, 0.92), vec3(0.06, 0.17, 0.56), smoothstep(0.0, 0.7, D));
  wcol = mix(wcol, vec3(0.03, 0.08, 0.27), smoothstep(0.6, 2.4, D));
  wcol *= 0.86 + 0.22 * smoothstep(-0.5, 0.5, p.y);
  wcol += vec3(0.32, 0.52, 1.0) * rays(wp, t) * 0.2 * exp(-D * 1.2) * smoothstep(0.0, 0.05, -sd);
  wcol += vec3(0.5, 0.72, 1.0) * caustic(wp * vec2(6.0, 9.0) + vec2(0.0, t * 0.05), t * 0.7) * 0.045 * exp(-D * 3.2);
  float sn = snow(wp, 22.0, t) + 0.6 * snow(wp + 3.7, 34.0, t * 0.7);
  wcol += vec3(0.6, 0.75, 1.0) * sn * 0.16 * (0.4 + 0.6 * exp(-D * 0.8));
  // Reflexión total bajo la superficie: banda clara y ondulada
  float band = exp(-max(-sd, 0.0) / 0.024);
  float streak = 0.5 + 0.5 * sin(wp.x * 85.0 + 3.0 * sin(wp.x * 12.0 + t) + t * 0.8);
  wcol += vec3(0.3, 0.55, 1.0) * band * (0.22 + 0.22 * streak);

  // Espuma del impacto: agua blanca turbulenta junto a la superficie
  float age = uImpact.y;
  float foam = 0.0;
  if (age > 0.0) {
    float dx = abs(wp.x - uImpact.x);
    float reach = fw * (0.55 + age * 0.18);
    foam = smoothstep(reach, reach * 0.4, dx) * exp(-max(-sd, 0.0) / (0.02 + 0.03 * age)) * exp(-age * 0.9) * smoothstep(0.0, 0.06, age);
    foam *= 0.45 + 0.9 * fbm(vec2(wp.x * 38.0, wp.y * 60.0 - age * 3.0));
    wcol += vec3(0.7, 0.84, 1.0) * foam * 0.55;
  }

  // Cavidad de aire que arrastra el armazón al entrar (se estrangula y se rompe en burbujas)
  float cav = 0.0;
  if (uImpact.z > 0.001) {
    vec2 a = vec2(uImpact.x, 0.0);
    vec2 b = uFrame.xy;
    vec2 pa = wp - a, ba = b - a;
    float k = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
    float r = fw * 0.5 * mix(1.0, 0.6, k) * uImpact.z * (1.0 - uImpact.w * 0.8 * sin(k * 3.14159));
    float wob = 0.004 * sin(wp.y * 70.0 + t * 4.0) + 0.003 * sin(wp.x * 50.0 - t * 3.0);
    float dc = length(pa - ba * k) - r + wob;
    vec2 e = (wp - b) / (vec2(fw * 0.53, fw / uFrameAspect * 0.78) * (0.55 + 0.45 * uImpact.z));
    float de = (length(e) - 1.0) * fw * 0.3 + wob;
    de = max(de, b.y - fw / uFrameAspect * 0.25 - wp.y);   // la bolsa de aire va por encima del armazón
    float d = min(dc, de);
    cav = (1.0 - smoothstep(-px, px, d)) * water;
    float rim = exp(-abs(d) / 0.0022) * water;
    float churn = fbm(vec2(wp.x * 26.0, wp.y * 34.0 + t * 1.5));
    vec3 pocket = mix(wcol, vec3(0.58, 0.74, 1.0), (0.05 + 0.22 * churn * churn) * smoothstep(0.0, -0.035, d));
    wcol = mix(wcol, pocket, cav);
    wcol += vec3(0.75, 0.88, 1.0) * rim * 0.14 * uImpact.z * churn;
    wcol += vec3(0.4, 0.6, 1.0) * exp(-abs(d) / 0.018) * 0.08 * uImpact.z;
    wcol -= vec3(0.02, 0.05, 0.1) * exp(-max(d, 0.0) / 0.012) * (1.0 - cav) * uImpact.z;
  }

  vec3 col = mix(air, wcol, water);
  float frameAlpha = 0.0;

  // Armazón real: nítido en el aire; bajo el agua se refracta, absorbe rojos y recibe cáusticas
  if (uHasTex > 0.5) {
    vec2 fd = wp - uFrame.xy;
    float c = cos(uFrame.w), s = sin(uFrame.w);
    vec2 q = vec2(c * fd.x - s * fd.y, s * fd.x + c * fd.y);
    float fh = fw / uFrameAspect;
    float uw = water * (1.0 - cav);
    vec2 uv = q / vec2(fw, fh) + 0.5;
    uv += uw * vec2(sin(wp.y * 55.0 + t * 2.2), sin(wp.x * 48.0 - t * 1.9)) * 0.0028 / vec2(fw, fh);
    if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
      vec4 tx = texture(uTex, uv);
      if (tx.a > 0.002) {
        float edge = clamp(tx.a - texture(uTex, uv + vec2(0.0, 0.014)).a, 0.0, 1.0);
        vec3 fc = tx.rgb;
        vec3 wet = fc * exp(-vec3(0.55, 0.28, 0.1) * (0.25 + D * 0.3)) + vec3(0.01, 0.035, 0.11) * tx.a;
        wet += tx.a * vec3(0.55, 0.75, 1.0) * caustic(q * 11.0 + vec2(0.0, t * 0.1), t * 0.9) * 0.07 * exp(-D * 0.6);
        fc = mix(fc, wet, uw * 0.85);
        fc += vec3(0.6, 0.78, 1.0) * edge * (0.12 + 0.16 * uw) * tx.a;
        col = col * (1.0 - tx.a) + fc;
        frameAlpha = tx.a;
      }
    }
  }

  // Menisco: la línea de la superficie pasa por delante de todo
  col += vec3(0.78, 0.9, 1.0) * exp(-abs(sd) / (0.0014 + px)) * 0.8 * (1.0 - 0.7 * frameAlpha);

  // Viñeta suave y grano de película
  float v = length(p * vec2(0.75, 1.0));
  col *= 1.0 - 0.32 * smoothstep(0.35, 0.95, v);
  col += (hash(gl_FragCoord.xy + fract(t * 7.0) * 100.0) - 0.5) * 0.022;
  col *= 1.0 - uFade;
  outColor = vec4(col, 1.0);
}`;

const PARTICLE_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aA;   // x, y, tamaño, tipo
layout(location = 2) in vec4 aB;   // vx, vy, alfa, semilla
uniform vec2 uRes;
uniform float uCamY;
out vec2 vUv;
out float vKind;
out float vAlpha;
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 offset;
  if (aA.w > 0.5 && aA.w < 1.5) {
    // Gota: se estira en la dirección de su velocidad (desenfoque de movimiento)
    float speed = length(aB.xy);
    vec2 dir = speed > 1e-4 ? aB.xy / speed : vec2(0.0, 1.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    offset = dir * aCorner.y * aA.z * (1.0 + speed * 4.5) + nrm * aCorner.x * aA.z;
  } else {
    offset = aCorner * aA.z;
  }
  vec2 sp = vec2(aA.x + offset.x, aA.y + offset.y - uCamY);
  gl_Position = vec4(sp.x / (aspect * 0.5), sp.y / 0.5, 0.0, 1.0);
  vUv = aCorner;
  vKind = aA.w;
  vAlpha = aB.z;
}`;

const PARTICLE_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
in float vKind;
in float vAlpha;
uniform float uFade;
out vec4 outColor;
void main() {
  float d = length(vUv);
  if (d > 1.0) discard;
  float a;
  if (vKind < 0.5) {
    // Burbuja: aro fino, brillo especular arriba y borde inferior más claro (refracción)
    float rim = smoothstep(0.6, 0.94, d) * smoothstep(1.0, 0.92, d);
    float hi = exp(-pow(length(vUv - vec2(-0.35, 0.38)) * 4.0, 2.0));
    float lo = smoothstep(0.5, 1.0, d) * smoothstep(0.0, -0.8, vUv.y) * 0.35;
    a = rim * 0.75 + 0.1 * (1.0 - d) + hi * 0.95 + lo;
  } else if (vKind < 1.5) {
    float hi = exp(-pow(length(vUv - vec2(-0.3, 0.3)) * 3.0, 2.0));
    a = smoothstep(1.0, 0.0, d) * 0.75 + hi * 0.4;
  } else {
    // Bokeh: disco desenfocado con borde apenas marcado
    a = exp(-d * d * 3.2) * 0.32 + smoothstep(0.62, 0.9, d) * smoothstep(1.0, 0.9, d) * 0.08;
  }
  a = clamp(a, 0.0, 1.0) * vAlpha * (1.0 - uFade);
  outColor = vec4(vec3(0.86, 0.92, 1.0) * a, a);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const program = gl.createProgram()!;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
  return program;
}

function locations<K extends string>(gl: WebGL2RenderingContext, program: WebGLProgram, names: readonly K[]) {
  return Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<K, WebGLUniformLocation | null>;
}

const SCENE_UNIFORMS = ["uRes", "uTime", "uCamY", "uFrame", "uFrameAspect", "uImpact", "uFade", "uHasTex", "uTex"] as const;
const PARTICLE_UNIFORMS = ["uRes", "uCamY", "uFade"] as const;

export class ImmersionRenderer {
  private gl: WebGL2RenderingContext;
  private sceneProgram: WebGLProgram;
  private particleProgram: WebGLProgram;
  private sceneVao: WebGLVertexArrayObject;
  private particleVao: WebGLVertexArrayObject;
  private instances: WebGLBuffer;
  private texture: WebGLTexture;
  private su: Record<(typeof SCENE_UNIFORMS)[number], WebGLUniformLocation | null>;
  private pu: Record<(typeof PARTICLE_UNIFORMS)[number], WebGLUniformLocation | null>;
  private aspect = 3;
  private hasTexture = false;
  lost = false;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 no disponible");
    this.gl = gl;
    this.sceneProgram = compile(gl, FULLSCREEN_VS, SCENE_FS);
    this.particleProgram = compile(gl, PARTICLE_VS, PARTICLE_FS);
    this.su = locations(gl, this.sceneProgram, SCENE_UNIFORMS);
    this.pu = locations(gl, this.particleProgram, PARTICLE_UNIFORMS);

    // Triángulo que cubre toda la pantalla
    this.sceneVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.sceneVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Partículas: un cuadro por instancia
    this.particleVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.particleVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.instances = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instances);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_PARTICLES * STRIDE * 4, gl.DYNAMIC_DRAW);
    for (const [loc, offset] of [
      [1, 0],
      [2, 16],
    ]) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, STRIDE * 4, offset);
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindVertexArray(null);

    this.texture = gl.createTexture()!;
    canvas.addEventListener("webglcontextlost", this.onLost);
  }

  private onLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
  };

  /** Sube la foto del armazón (alfa premultiplicado y mipmaps: bordes limpios a cualquier escala). */
  setTexture(image: TexImageSource & { width: number; height: number }) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.aspect = image.width / image.height;
    this.hasTexture = true;
  }

  get ready() {
    return this.hasTexture;
  }

  resize(cssWidth: number, cssHeight: number, dpr: number) {
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  render(scene: Scene, particles: Float32Array, count: number, time: number, fade: number) {
    if (this.lost) return;
    const gl = this.gl;
    const { width, height } = this.canvas;
    gl.viewport(0, 0, width, height);

    gl.disable(gl.BLEND);
    gl.useProgram(this.sceneProgram);
    const su = this.su;
    gl.uniform2f(su.uRes, width, height);
    gl.uniform1f(su.uTime, time);
    gl.uniform1f(su.uCamY, scene.camY);
    gl.uniform4f(su.uFrame, scene.frameX, scene.frameY, scene.frameW, scene.frameRot);
    gl.uniform1f(su.uFrameAspect, this.aspect);
    gl.uniform4f(su.uImpact, scene.impactX, scene.splash, scene.cavity, scene.pinch);
    gl.uniform1f(su.uFade, fade);
    gl.uniform1f(su.uHasTex, this.hasTexture ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(su.uTex, 0);
    gl.bindVertexArray(this.sceneVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (count > 0) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.particleProgram);
      gl.uniform2f(this.pu.uRes, width, height);
      gl.uniform1f(this.pu.uCamY, scene.camY);
      gl.uniform1f(this.pu.uFade, fade);
      gl.bindVertexArray(this.particleVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instances);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, particles, 0, count * STRIDE);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    }
    gl.bindVertexArray(null);
  }

  dispose() {
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    const gl = this.gl;
    gl.deleteProgram(this.sceneProgram);
    gl.deleteProgram(this.particleProgram);
    gl.deleteTexture(this.texture);
    gl.deleteBuffer(this.instances);
    gl.deleteVertexArray(this.sceneVao);
    gl.deleteVertexArray(this.particleVao);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
