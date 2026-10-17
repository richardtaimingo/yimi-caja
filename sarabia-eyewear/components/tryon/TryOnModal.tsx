"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImageUp, Loader2, MessageCircle, UserRound, X } from "lucide-react";
import clsx from "clsx";
import { FrameIllustration } from "../FrameIllustration";
import { ProductImage } from "../ProductImage";
import { materialLabels, products } from "@/lib/products";
import { currency, tryOnMessage, whatsappLink } from "@/lib/site";
import { swatchStyle } from "@/lib/swatch";
import {
  DEFAULT_MANUAL_POSE,
  FRAME_SVG,
  computeFit,
  drawGlasses,
  geometryFromPhoto,
  drawSource,
  frameScale,
  poseFromLandmarks,
  poseFromManual,
  smoothPose,
  type FrameGeometry,
  type GlassesPose,
  type Landmark,
  type ManualPose,
} from "@/lib/tryon/geometry";
import { drawMannequin } from "@/lib/tryon/mannequin";
import type { FaceTracker } from "@/lib/tryon/faceTracker";

type Mode = "intro" | "camera" | "photo" | "mannequin";
type TrackerState = "idle" | "loading" | "ready" | "failed";
type PhotoState = "detecting" | "face" | "manual";
type Capture = { id: number; url: string; label: string; fileName: string };

const FACE_LOST_MS = 450;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function describeCameraError(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Bloqueaste el permiso de la cámara. Puedes activarlo desde el candado de la barra de direcciones, o probártelos con una foto.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No encontramos una cámara en este dispositivo.";
  if (name === "NotReadableError") return "Otra aplicación está usando tu cámara. Ciérrala e inténtalo de nuevo.";
  return "No pudimos abrir tu cámara.";
}

/** Marca de agua de las capturas: marca + modelo + color. */
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, model: string, color: string) {
  const size = Math.max(14, Math.round(Math.min(w, h) * 0.035));
  const pad = Math.round(size * 0.9);
  const brand = "SARABIA Eyewear";
  const detail = `${model} · ${color}`;
  ctx.save();
  ctx.font = `600 ${size}px GeistSans, system-ui, sans-serif`;
  const w1 = ctx.measureText(brand).width;
  ctx.font = `400 ${Math.round(size * 0.78)}px GeistSans, system-ui, sans-serif`;
  const w2 = ctx.measureText(detail).width;
  const boxW = Math.max(w1, w2) + pad * 2;
  const boxH = size * 2.7;
  const x = pad;
  const y = h - pad - boxH;
  ctx.fillStyle = "rgba(21,21,20,0.62)";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, boxW, boxH, size * 0.6);
  else ctx.rect(x, y, boxW, boxH);
  ctx.fill();
  ctx.fillStyle = "#F9F9F8";
  ctx.textBaseline = "top";
  ctx.font = `600 ${size}px GeistSans, system-ui, sans-serif`;
  ctx.fillText(brand, x + pad, y + size * 0.45);
  ctx.font = `400 ${Math.round(size * 0.78)}px GeistSans, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(249,249,248,0.75)";
  ctx.fillText(detail, x + pad, y + size * 1.6);
  ctx.restore();
}

type Props = { initialProductId: string; initialColorId: string; onClose: () => void };

export function TryOnModal({ initialProductId, initialColorId, onClose }: Props) {
  const [selected, setSelected] = useState({ productId: initialProductId, colorId: initialColorId });
  const product = products.find((p) => p.id === selected.productId) ?? products[0];
  const color = product.colors.find((c) => c.id === selected.colorId) ?? product.colors[0];

  const [mode, setMode] = useState<Mode>("intro");
  const [starting, setStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [trackerState, setTrackerState] = useState<TrackerState>("idle");
  const [photoState, setPhotoState] = useState<PhotoState>("detecting");
  const [faceFound, setFaceFound] = useState(false);
  const [manual, setManual] = useState<ManualPose>(DEFAULT_MANUAL_POSE);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [flashKey, setFlashKey] = useState(0);

  const manualActive = (mode === "camera" && trackerState === "failed") || (mode === "photo" && photoState === "manual");

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  // Estado que lee el ciclo de dibujo (refs para no reiniciar requestAnimationFrame).
  const selectedRef = useRef(selected);
  const modeRef = useRef<Mode>("intro");
  const manualRef = useRef(manual);
  const manualActiveRef = useRef(manualActive);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<FaceTracker | null>(null);
  const trackerLoadRef = useRef<Promise<FaceTracker | null> | null>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const photoUrlRef = useRef<string | null>(null);
  const photoLandmarksRef = useRef<Landmark[] | null>(null);
  const photoStateRef = useRef<PhotoState>("detecting");
  const smoothedRef = useRef<GlassesPose | null>(null);
  const lastPoseRef = useRef<GlassesPose | null>(null);
  const lastSeenRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const faceRef = useRef(false);
  const glassesRef = useRef<HTMLImageElement | null>(null);
  const glassesCache = useRef(new Map<string, HTMLImageElement>());
  const geometryRef = useRef<FrameGeometry>(FRAME_SVG);
  const scaleRef = useRef(frameScale(product));
  const mannequinRef = useRef({ yaw: 0.35, pitch: 0, dragging: false, lastInteraction: 0 });
  const dragRef = useRef<{ x: number; y: number; manual: ManualPose; yaw: number; pitch: number } | null>(null);
  const unmountedRef = useRef(false);

  selectedRef.current = selected;
  manualRef.current = manual;
  manualActiveRef.current = manualActive;
  photoStateRef.current = photoState;
  scaleRef.current = frameScale(product);

  const switchMode = useCallback((next: Mode) => {
    modeRef.current = next;
    smoothedRef.current = null;
    lastPoseRef.current = null;
    setMode(next);
  }, []);

  // ---------- Cámara ----------
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const loadTracker = useCallback(() => {
    if (trackerRef.current) return Promise.resolve(trackerRef.current);
    if (trackerLoadRef.current) return trackerLoadRef.current;
    setTrackerState("loading");
    trackerLoadRef.current = import("@/lib/tryon/faceTracker")
      .then((m) => m.getFaceTracker())
      .then((tracker) => {
        trackerRef.current = tracker;
        if (!unmountedRef.current) setTrackerState("ready");
        return tracker;
      })
      .catch((error) => {
        console.warn("[probador] No se pudo cargar el detector facial; se usa el modo manual.", error);
        trackerLoadRef.current = null;
        if (!unmountedRef.current) setTrackerState("failed");
        return null;
      });
    return trackerLoadRef.current;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Tu navegador no permite usar la cámara en esta página. Prueba con una foto o con el maniquí 3D.");
      return;
    }
    setStarting(true);
    void loadTracker(); // se descarga en paralelo mientras el usuario concede el permiso
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (unmountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      stopCamera();
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      lastVideoTimeRef.current = -1;
      switchMode("camera");
    } catch (error) {
      // El aviso y las alternativas viven en la pantalla inicial.
      setCameraError(describeCameraError(error));
      switchMode("intro");
    } finally {
      if (!unmountedRef.current) setStarting(false);
    }
  }, [loadTracker, stopCamera, switchMode]);

  // Si el permiso ya estaba concedido, se abre la cámara sin pedir otro clic.
  useEffect(() => {
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((status) => {
        if (!cancelled && status.state === "granted") void startCamera();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [startCamera]);

  // Limpieza al cerrar: apagar la cámara y liberar la foto subida.
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      stopCamera();
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, [stopCamera]);

  // ---------- Foto ----------
  const onPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = url;
      photoRef.current = img;
      photoLandmarksRef.current = null;
      stopCamera();
      setCameraError(null);
      setPhotoState("detecting");
      switchMode("photo");

      const tracker = await loadTracker();
      let landmarks: Landmark[] | null = null;
      if (tracker) {
        try {
          landmarks = await tracker.detectImage(img);
        } catch (error) {
          console.warn("[probador] Falló la detección en la foto.", error);
        }
      }
      if (photoRef.current !== img || unmountedRef.current) return;
      photoLandmarksRef.current = landmarks;
      if (!landmarks) setManual(DEFAULT_MANUAL_POSE);
      setPhotoState(landmarks ? "face" : "manual");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setCameraError("No pudimos leer esa imagen. Prueba con una foto JPG o PNG.");
    };
    img.src = url;
  };

  const startMannequin = () => {
    stopCamera();
    mannequinRef.current.lastInteraction = 0;
    switchMode("mannequin");
  };

  // ---------- Imagen del armazón para el canvas: foto recortada (o SVG de respaldo) ----------
  useEffect(() => {
    const key = `${product.id}-${color.id}`;
    const photo = color.photo;
    const geometry = photo ? geometryFromPhoto(photo.width, photo.height, photo.lensCenters) : FRAME_SVG;
    const cached = glassesCache.current.get(key);
    if (cached) {
      glassesRef.current = cached;
      geometryRef.current = geometry;
      return;
    }
    let src: string;
    if (photo) {
      src = photo.front;
    } else {
      const svg = holderRef.current?.querySelector("svg");
      if (!svg) return;
      src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    }
    const img = new Image();
    img.onload = () => {
      glassesCache.current.set(key, img);
      if (`${selectedRef.current.productId}-${selectedRef.current.colorId}` === key) {
        glassesRef.current = img;
        geometryRef.current = geometry;
      }
    };
    img.src = src;
  }, [product.id, color.id, color.photo]);

  // ---------- Canvas: tamaño y ciclo de dibujo ----------
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(stage.clientWidth * dpr);
      canvas.height = Math.round(stage.clientHeight * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let opacity = 0;

    const setFace = (found: boolean) => {
      if (faceRef.current !== found) {
        faceRef.current = found;
        setFaceFound(found);
      }
    };

    const render = () => {
      raf = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const now = performance.now();
      ctx.clearRect(0, 0, W, H);
      let target: GlassesPose | null = null;

      const m = modeRef.current;
      if (m === "camera") {
        const video = videoRef.current;
        if (video && video.readyState >= 2 && video.videoWidth) {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const fit = computeFit(vw, vh, W, H, "cover", true);
          drawSource(ctx, video, vw, vh, fit);
          const tracker = trackerRef.current;
          if (manualActiveRef.current) {
            target = poseFromManual(manualRef.current, W, H);
          } else if (tracker) {
            if (video.currentTime !== lastVideoTimeRef.current) {
              lastVideoTimeRef.current = video.currentTime;
              const landmarks = tracker.detectVideo(video, now);
              const raw = landmarks ? poseFromLandmarks(landmarks, vw, vh, fit) : null;
              if (raw) {
                smoothedRef.current = smoothPose(smoothedRef.current, raw);
                lastSeenRef.current = now;
              }
            }
            if (now - lastSeenRef.current > FACE_LOST_MS) smoothedRef.current = null;
            target = smoothedRef.current;
            setFace(Boolean(target));
          }
        }
      } else if (m === "photo") {
        const img = photoRef.current;
        if (img) {
          const fit = computeFit(img.naturalWidth, img.naturalHeight, W, H, "contain", false);
          ctx.fillStyle = "#0d0d0c";
          ctx.fillRect(0, 0, W, H);
          drawSource(ctx, img, img.naturalWidth, img.naturalHeight, fit);
          const landmarks = photoLandmarksRef.current;
          if (landmarks && !manualActiveRef.current) target = poseFromLandmarks(landmarks, img.naturalWidth, img.naturalHeight, fit);
          else if (photoStateRef.current === "manual") target = poseFromManual(manualRef.current, W, H);
        }
      } else if (m === "mannequin") {
        const mq = mannequinRef.current;
        if (!mq.dragging && !reducedMotion && now - mq.lastInteraction > 2500) {
          // Giro suave mientras nadie lo toca
          const t = now / 1000;
          mq.yaw += (Math.sin(t * 0.6) * 0.45 - mq.yaw) * 0.04;
          mq.pitch += (Math.sin(t * 0.45) * 0.08 - mq.pitch) * 0.04;
        }
        target = drawMannequin(ctx, W, H, mq.yaw, mq.pitch);
      }

      // Aparece/desaparece suavemente cuando se encuentra o se pierde el rostro.
      opacity += ((target ? 1 : 0) - opacity) * 0.25;
      if (target) lastPoseRef.current = target;
      const pose = target ?? lastPoseRef.current;
      const glasses = glassesRef.current;
      if (pose && glasses && opacity > 0.02) drawGlasses(ctx, glasses, pose, scaleRef.current, opacity, geometryRef.current);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------- Arrastre: mover lentes (manual) o girar el maniquí ----------
  const draggable = mode === "mannequin" || manualActive;

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draggable) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const mq = mannequinRef.current;
    mq.dragging = true;
    dragRef.current = { x: event.clientX, y: event.clientY, manual: manualRef.current, yaw: mq.yaw, pitch: mq.pitch };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - drag.x) / rect.width;
    const dy = (event.clientY - drag.y) / rect.height;
    if (modeRef.current === "mannequin") {
      const mq = mannequinRef.current;
      mq.yaw = clamp(drag.yaw - dx * 2.4, -0.75, 0.75);
      mq.pitch = clamp(drag.pitch + dy * 1.4, -0.35, 0.35);
      mq.lastInteraction = performance.now();
    } else {
      setManual({ ...drag.manual, x: clamp(drag.manual.x + dx, 0.05, 0.95), y: clamp(drag.manual.y + dy, 0.05, 0.95) });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    mannequinRef.current.dragging = false;
    mannequinRef.current.lastInteraction = performance.now();
  };

  // ---------- Captura ----------
  const capture = () => {
    const canvas = canvasRef.current;
    if (!canvas || mode === "intro") return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(canvas, 0, 0);
    drawWatermark(ctx, out.width, out.height, product.name, color.name);
    let url: string;
    try {
      url = out.toDataURL("image/jpeg", 0.9);
    } catch {
      return;
    }
    const fileName = `sarabia-${product.id}-${color.id}.jpg`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setCaptures((prev) => [{ id: Date.now(), url, label: `${product.name} · ${color.name}`, fileName }, ...prev].slice(0, 6));
    setFlashKey((n) => n + 1);
  };

  // ---------- Teclado y scroll ----------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const status = (() => {
    if (mode === "camera") {
      if (manualActive) return { tone: "warn", text: "Modo manual: arrastra los lentes" } as const;
      if (trackerState !== "ready") return { tone: "busy", text: "Cargando probador…" } as const;
      return faceFound ? ({ tone: "ok", text: "Rostro detectado" } as const) : ({ tone: "idle", text: "Mira de frente a la cámara" } as const);
    }
    if (mode === "photo") {
      if (photoState === "detecting") return { tone: "busy", text: "Analizando tu foto…" } as const;
      if (photoState === "face") return { tone: "ok", text: "Rostro detectado" } as const;
      return { tone: "warn", text: "Acomoda los lentes arrastrándolos" } as const;
    }
    if (mode === "mannequin") return { tone: "idle", text: "Arrastra para girar el maniquí" } as const;
    return null;
  })();

  const modeButtons = [
    { id: "camera", label: "Cámara", icon: Camera, onClick: () => (mode === "camera" ? undefined : void startCamera()) },
    { id: "photo", label: "Foto", icon: ImageUp, onClick: () => fileRef.current?.click() },
    { id: "mannequin", label: "Maniquí 3D", icon: UserRound, onClick: startMannequin },
  ] as const;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/70 backdrop-blur-sm lg:items-center lg:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Probador virtual: ${product.name}`}
    >
      <motion.div
        initial={{ y: 28, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 28, scale: 0.98 }}
        transition={{ type: "spring", bounce: 0.12, duration: 0.5 }}
        className="relative flex h-[100dvh] w-full flex-col overflow-y-auto bg-night-2 text-paper lg:h-[min(88vh,820px)] lg:max-w-6xl lg:flex-row lg:overflow-hidden lg:rounded-[2rem] lg:shadow-lift"
      >
        {/* Escenario */}
        <div ref={stageRef} className="relative min-h-[60dvh] flex-1 overflow-hidden bg-[#0d0d0c] lg:min-h-0">
          <canvas
            ref={canvasRef}
            className={clsx("absolute inset-0 h-full w-full select-none", draggable && "cursor-grab touch-none active:cursor-grabbing")}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            aria-label={`Vista previa de los ${product.name} en ${color.name}`}
            role="img"
          />
          {/* El video sólo alimenta al canvas; se mantiene renderizado (iOS no entrega cuadros de un video oculto). */}
          <video ref={videoRef} className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0" playsInline muted autoPlay />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />

          {/* Barra superior */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
            {mode !== "intro" ? (
              <div className="flex flex-col items-start gap-2">
                <div className="flex rounded-full bg-black/55 p-1 backdrop-blur" role="tablist" aria-label="Modo del probador">
                  {modeButtons.map(({ id, label, icon: Icon, onClick }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={mode === id}
                      onClick={onClick}
                      className={clsx(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        mode === id ? "bg-paper text-night" : "text-paper/80 hover:text-paper",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
                {status && (
                  <p
                    aria-live="polite"
                    className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-paper/90 backdrop-blur"
                  >
                    {status.tone === "busy" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span
                        className={clsx(
                          "h-2 w-2 rounded-full",
                          status.tone === "ok" ? "bg-[#25D366]" : status.tone === "warn" ? "bg-sun" : "bg-paper/50",
                        )}
                      />
                    )}
                    {status.text}
                  </p>
                )}
              </div>
            ) : (
              <p className="eyebrow pt-2 text-paper/60">Probador virtual</p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/55 backdrop-blur transition hover:bg-black/75"
              aria-label="Cerrar probador"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Pantalla inicial: permiso de cámara y alternativas */}
          {mode === "intro" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto p-6 pt-16">
              <div className="w-full max-w-sm text-center">
                <div className="mx-auto w-52 rounded-3xl bg-paper px-6 py-5 sm:w-60">
                  <ProductImage product={product} color={color} sizes="240px" className="h-auto w-full" />
                </div>
                <h2 className="mt-6 text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  Activa tu cámara para probarte los {product.name} en tiempo real
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-paper/60">
                  Tu imagen se procesa en tu dispositivo: no se guarda ni se envía a ningún servidor.
                </p>

                {cameraError && (
                  <div role="alert" className="mt-5 rounded-2xl border border-sun/30 bg-white/[0.06] p-4 text-left text-sm">
                    <p className="font-semibold">No pudimos usar tu cámara</p>
                    <p className="mt-1 leading-relaxed text-paper/70">{cameraError}</p>
                  </div>
                )}

                {cameraError ? (
                  <div className="mt-5 grid gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn-paper h-14 w-full text-base">
                      <ImageUp className="h-5 w-5" /> Subir una foto de frente
                    </button>
                    <button
                      type="button"
                      onClick={startMannequin}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold transition hover:border-white/50"
                    >
                      <UserRound className="h-4 w-4" /> Verlos en el maniquí 3D
                    </button>
                    <button type="button" onClick={() => void startCamera()} className="mt-1 text-sm font-medium text-paper/60 underline-offset-4 hover:text-paper hover:underline">
                      Intentar de nuevo con la cámara
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-2">
                    <button type="button" autoFocus onClick={() => void startCamera()} disabled={starting} className="btn-paper h-14 w-full text-base disabled:opacity-70">
                      {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                      {starting ? "Esperando permiso…" : "Activar cámara"}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold transition hover:border-white/50"
                      >
                        <ImageUp className="h-4 w-4" /> Subir foto
                      </button>
                      <button
                        type="button"
                        onClick={startMannequin}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold transition hover:border-white/50"
                      >
                        <UserRound className="h-4 w-4" /> Maniquí 3D
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ajuste manual */}
          {manualActive && (
            <div className="absolute inset-x-3 bottom-24 z-10 mx-auto grid max-w-sm gap-2 rounded-2xl bg-black/60 p-3 text-xs backdrop-blur">
              <label className="flex items-center gap-3">
                <span className="w-20 text-paper/70">Tamaño</span>
                <input
                  type="range"
                  min={0.08}
                  max={0.4}
                  step={0.005}
                  value={manual.size}
                  onChange={(e) => setManual((prev) => ({ ...prev, size: Number(e.target.value) }))}
                  className="w-full accent-[#F6B40E]"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-20 text-paper/70">Inclinación</span>
                <input
                  type="range"
                  min={-0.35}
                  max={0.35}
                  step={0.01}
                  value={manual.roll}
                  onChange={(e) => setManual((prev) => ({ ...prev, roll: Number(e.target.value) }))}
                  className="w-full accent-[#F6B40E]"
                />
              </label>
            </div>
          )}

          {/* Obturador */}
          {mode !== "intro" && (
            <button
              type="button"
              onClick={capture}
              className="absolute bottom-5 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white/85 bg-white/15 backdrop-blur transition active:scale-95"
              aria-label="Tomar foto con los lentes puestos"
            >
              <span className="h-11 w-11 rounded-full bg-white" />
            </button>
          )}

          <AnimatePresence>
            {flashKey > 0 && (
              <motion.div
                key={flashKey}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="pointer-events-none absolute inset-0 z-30 bg-white"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Panel de producto */}
        <aside className="flex shrink-0 flex-col gap-4 border-t border-white/10 bg-night-2 p-4 sm:p-5 lg:w-[380px] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-paper/50 lg:block">Probador virtual</p>
              <h3 className="text-xl font-semibold tracking-tight lg:mt-2 lg:text-3xl">{product.name}</h3>
              <p className="truncate text-sm text-paper/60">
                {color.name} · {materialLabels[product.material].badge}
              </p>
            </div>
            <p className="shrink-0 text-lg font-semibold lg:mt-7">{currency.format(product.price)}</p>
          </div>

          <div className="flex items-center gap-2" role="radiogroup" aria-label={`Colores de ${product.name}`}>
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={c.id === color.id}
                aria-label={c.name}
                title={c.name}
                onClick={() => setSelected((prev) => ({ ...prev, colorId: c.id }))}
                className={clsx(
                  "h-8 w-8 rounded-full ring-offset-2 ring-offset-night transition",
                  c.id === color.id ? "ring-2 ring-paper" : "ring-1 ring-white/20 hover:ring-white/50",
                )}
                style={swatchStyle(c)}
              />
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Cambia de armazón</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
              {products.map((p) => {
                const isCurrent = p.id === product.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={isCurrent}
                    onClick={() => setSelected({ productId: p.id, colorId: p.colors[0].id })}
                    className={clsx(
                      "w-[4.75rem] shrink-0 rounded-2xl p-1.5 text-left transition lg:w-auto",
                      isCurrent ? "bg-white/15 ring-2 ring-paper" : "bg-white/[0.05] hover:bg-white/10",
                    )}
                  >
                    <span className="block rounded-xl bg-paper px-1.5 py-2">
                      <ProductImage product={p} color={p.colors[0]} sizes="80px" className="h-5 w-full object-contain" />
                    </span>
                    <span className="mt-1 block truncate px-0.5 text-[0.7rem] font-medium">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {captures.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Tus capturas para comparar</p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
                {captures.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    download={c.fileName}
                    className="relative block w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15 lg:w-auto"
                    title={`Descargar ${c.label}`}
                  >
                    <img src={c.url} alt={c.label} className="aspect-[3/4] w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-1.5 py-1 text-[0.6rem]">{c.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto grid gap-2">
            <a
              href={whatsappLink(tryOnMessage(product.name, color.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-base font-semibold text-night transition hover:brightness-95"
            >
              <MessageCircle className="h-5 w-5" /> Comprar este modelo por WhatsApp
            </a>
            <p className="hidden text-center text-xs text-paper/50 lg:block">
              La imagen se procesa en tu dispositivo. Las capturas se guardan sólo en tus descargas.
            </p>
          </div>
        </aside>

        {/* SVG del armazón actual que se convierte en imagen para el canvas */}
        <div ref={holderRef} className="hidden" aria-hidden>
          <FrameIllustration shape={product.shape} material={product.material} color={color} variant="tryon" width={1200} height={520} />
        </div>
      </motion.div>
    </motion.div>
  );
}
