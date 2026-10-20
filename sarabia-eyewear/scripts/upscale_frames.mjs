/**
 * Super-resolución ESRGAN (8x por defecto) de los recortes exportados por cutout_frames.py --export-crops.
 * No son dependencias del sitio: ejecútalo desde una carpeta aparte donde estén instalados
 *   npm i upscaler@1.0.0 @upscalerjs/esrgan-thick@1.0.0 @tensorflow/tfjs-node@4.22.0
 * Uso: node <ruta>/upscale_frames.mjs <crops> <salida> [escala: 2|3|4|8]
 */
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "index.js"));
const tf = require("@tensorflow/tfjs-node");
const Upscaler = require("upscaler/node");
const [input, output, scale = "8"] = process.argv.slice(2);
const model = require(`@upscalerjs/esrgan-thick/${scale}x`);

mkdirSync(output, { recursive: true });
const upscaler = new Upscaler({ model });

for (const file of readdirSync(input).filter((f) => f.endsWith(".png"))) {
  const started = Date.now();
  const image = tf.node.decodeImage(readFileSync(path.join(input, file)), 3);
  // Parches con margen amplio: memoria acotada y sin costuras (las costuras dejaban motas en las esquinas)
  const result = await upscaler.upscale(image, { output: "tensor", patchSize: 128, padding: 16 });
  const png = await tf.node.encodePng(tf.cast(tf.clipByValue(result, 0, 255), "int32"));
  writeFileSync(path.join(output, file), png);
  console.log(`${file.padEnd(28)} ${image.shape[1]}x${image.shape[0]} → ${result.shape[1]}x${result.shape[0]} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  tf.dispose([image, result]);
}
