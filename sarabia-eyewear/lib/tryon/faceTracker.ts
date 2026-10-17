import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { Landmark } from "./geometry";

/**
 * Detector de landmarks faciales con MediaPipe FaceLandmarker (@mediapipe/tasks-vision),
 * el sucesor oficial de @mediapipe/face_mesh: misma malla de 468 puntos (+10 de iris),
 * mismos índices (33, 133, 263, 362, 168, 6…).
 *
 * Este archivo se importa con import() dinámico desde el probador: ni la librería ni el
 * modelo se descargan hasta que alguien abre la cámara o sube una foto.
 *
 * Archivos que se cargan en tiempo de ejecución (configurables por variables de entorno):
 * - WASM (~12 MB, se cachea): jsDelivr, misma versión que package.json.
 * - Modelo face_landmarker.task (~3.6 MB): almacenamiento público de Google.
 * Para servirlos desde tu dominio, copia node_modules/@mediapipe/tasks-vision/wasm a
 * public/mediapipe/wasm, descarga el .task a public/mediapipe/ y define:
 *   NEXT_PUBLIC_MEDIAPIPE_WASM_URL=/mediapipe/wasm
 *   NEXT_PUBLIC_FACE_MODEL_URL=/mediapipe/face_landmarker.task
 *
 * ── Alternativa con la API clásica (@mediapipe/face_mesh + @mediapipe/camera_utils) ──
 * Si prefieres el paquete legado por CDN, el equivalente es:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>
 *
 *   const faceMesh = new FaceMesh({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
 *   faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
 *   faceMesh.onResults((r) => { latest = r.multiFaceLandmarks?.[0] ?? null; });
 *   new Camera(video, { onFrame: () => faceMesh.send({ image: video }), width: 1280, height: 720 }).start();
 *
 * `latest` tiene la misma forma que Landmark[]: pásalo a poseFromLandmarks() de geometry.ts
 * y el resto del probador (dibujo, escala, rotación, captura) funciona igual.
 */

// Debe coincidir con la versión exacta de @mediapipe/tasks-vision en package.json.
export const MEDIAPIPE_VERSION = "1.0.1";

const WASM_URL = process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_URL || `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  process.env.NEXT_PUBLIC_FACE_MODEL_URL ||
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type FaceTracker = {
  /** Modo video: llamar una vez por cuadro nuevo, con timestamps crecientes. */
  detectVideo: (video: HTMLVideoElement, timestamp: number) => Landmark[] | null;
  /** Modo imagen: para fotos subidas. */
  detectImage: (image: HTMLImageElement) => Promise<Landmark[] | null>;
};

let trackerPromise: Promise<FaceTracker> | null = null;

/**
 * Crea (una sola vez por sesión) el detector. Intenta GPU y, si el dispositivo no lo
 * soporta, recurre a CPU. Se mantiene en memoria para reabrir el probador al instante.
 */
export function getFaceTracker(): Promise<FaceTracker> {
  if (!trackerPromise) {
    trackerPromise = createTracker().catch((error) => {
      trackerPromise = null; // permite reintentar en la siguiente apertura
      throw error;
    });
  }
  return trackerPromise;
}

async function createTracker(): Promise<FaceTracker> {
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);

  const create = (delegate: "GPU" | "CPU") =>
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

  let landmarker: FaceLandmarker;
  try {
    landmarker = await create("GPU");
  } catch {
    landmarker = await create("CPU");
  }

  let mode: "VIDEO" | "IMAGE" = "VIDEO";
  let switching: Promise<void> | null = null;
  const ensureMode = async (next: "VIDEO" | "IMAGE"): Promise<void> => {
    while (switching) await switching;
    if (mode === next) return;
    switching = landmarker
      .setOptions({ runningMode: next })
      .then(() => {
        mode = next;
      })
      .finally(() => {
        switching = null;
      });
    await switching;
  };

  return {
    detectVideo(video, timestamp) {
      // Mientras se procesa una foto el detector está en modo IMAGE; se omite ese cuadro.
      if (mode !== "VIDEO" || switching) {
        if (!switching) void ensureMode("VIDEO");
        return null;
      }
      const result = landmarker.detectForVideo(video, timestamp);
      return result.faceLandmarks[0] ?? null;
    },
    async detectImage(image) {
      await ensureMode("IMAGE");
      const result = landmarker.detect(image);
      return result.faceLandmarks[0] ?? null;
    },
  };
}
