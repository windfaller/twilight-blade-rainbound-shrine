import * as THREE from "three";

function srcSize(img: TexImageSource): { w: number; h: number } {
  if ("width" in img && "height" in img) {
    return { w: Number(img.width), h: Number(img.height) };
  }
  return { w: 1024, h: 1536 };
}

function sampleBg(d: Uint8ClampedArray, w: number, h: number): { r: number; g: number; b: number } {
  const pts = [
    0,
    4,
    (w - 5) * 4,
    ((h - 1) * w) * 4,
    ((h - 1) * w + w - 5) * 4,
    (Math.floor(h * 0.08) * w + 6) * 4,
    (Math.floor(h * 0.08) * w + w - 7) * 4,
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const i of pts) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
  }
  const n = pts.length;
  return { r: r / n, g: g / n, b: b / n };
}

/** Tight figure cutout. Unused plane pixels must be fully discarded — no card, no blur fill. */
export function cutoutSpriteTexture(src: THREE.Texture): THREE.Texture {
  const img = src.image as TexImageSource | undefined;
  if (!img || typeof document === "undefined") return src;
  const { w, h } = srcSize(img);
  if (!w || !h) return src;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return src;
  ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  const bg = sampleBg(d, w, h);

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  const border = Math.max(6, Math.round(Math.min(w, h) * 0.03));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x < border || y < border || x >= w - border || y >= h - border) {
        d[i + 3] = 0;
        continue;
      }
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const dr = r - bg.r;
      const dg = g - bg.g;
      const db = b - bg.b;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const luma = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      let a = 1;
      if (dist < 28 && chroma < 22) a = 0;
      else if (dist < 42 && chroma < 28) a = (dist - 28) / 14;
      if (luma < 22 && chroma < 12) a = 0;
      else if (luma < 36 && chroma < 16) a *= (luma - 22) / 14;
      const outA = Math.round(255 * Math.max(0, Math.min(1, a)));
      d[i + 3] = outA;
      if (outA > 40) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(image, 0, 0);

  if (maxX <= minX || maxY <= minY) return src;
  const pad = 4;
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad) - x0;
  const ch = Math.min(h, maxY + pad) - y0;
  const cropped = document.createElement("canvas");
  cropped.width = cw;
  cropped.height = ch;
  const cctx = cropped.getContext("2d", { willReadFrequently: true });
  if (!cctx) return src;
  cctx.drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
  const crop = cctx.getImageData(0, 0, cw, ch);
  const cd = crop.data;
  const rim = 2;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (x < rim || y < rim || x >= cw - rim || y >= ch - rim) {
        cd[(y * cw + x) * 4 + 3] = 0;
      }
    }
  }
  cctx.putImageData(crop, 0, 0);

  const tex = new THREE.CanvasTexture(cropped);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  tex.premultiplyAlpha = false;
  return tex;
}
