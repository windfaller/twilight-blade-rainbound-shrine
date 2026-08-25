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
    (h - 1) * w * 4,
    ((h - 1) * w + w - 5) * 4,
    (Math.floor(h * 0.04) * w + 8) * 4,
    (Math.floor(h * 0.5) * w + 4) * 4,
    (Math.floor(h * 0.5) * w + w - 5) * 4,
    (Math.floor(h * 0.88) * w + 5) * 4,
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

function isPaleCard(r: number, g: number, b: number): boolean {
  const luma = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return (luma > 140 && chroma < 42) || (luma > 108 && chroma < 28);
}

/**
 * Pale studio card, light-gray / off-white quad, cool mid-gray wash,
 * or navy similar to sampled edges. Warm skin / vermilion / brown hair survive.
 */
export function isBackdropPixel(r: number, g: number, b: number, bg?: { r: number; g: number; b: number }): boolean {
  const luma = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const cool = b >= g - 6 && g >= r - 8;
  if (isPaleCard(r, g, b)) return true;
  if (cool && luma > 62 && luma < 160 && chroma < 50 && chroma <= luma * 0.55) return true;
  if (luma < 32 && chroma < 18 && cool) return true;
  if (bg) {
    const dist = Math.hypot(r - bg.r, g - bg.g, b - bg.b);
    if (dist < 34 && chroma < 34) return true;
  }
  return false;
}

function floodKillCard(d: Uint8ClampedArray, w: number, h: number, bg: { r: number; g: number; b: number }): void {
  const seen = new Uint8Array(w * h);
  const q: number[] = [];
  const tryEnqueue = (x: number, y: number, fr: number, fg: number, fb: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (seen[i]) return;
    const p = i * 4;
    const r = d[p];
    const g = d[p + 1];
    const b = d[p + 2];
    if (!isBackdropPixel(r, g, b, bg)) return;
    const distN = Math.hypot(r - fr, g - fg, b - fb);
    if (distN > 26 && !isPaleCard(r, g, b)) return;
    seen[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < w; x++) {
    tryEnqueue(x, 0, d[x * 4], d[x * 4 + 1], d[x * 4 + 2]);
    const i = ((h - 1) * w + x) * 4;
    tryEnqueue(x, h - 1, d[i], d[i + 1], d[i + 2]);
  }
  for (let y = 0; y < h; y++) {
    const l = y * w * 4;
    tryEnqueue(0, y, d[l], d[l + 1], d[l + 2]);
    const r = (y * w + w - 1) * 4;
    tryEnqueue(w - 1, y, d[r], d[r + 1], d[r + 2]);
  }
  while (q.length) {
    const i = q.pop()!;
    const x = i % w;
    const y = (i / w) | 0;
    const p = i * 4;
    d[p + 3] = 0;
    tryEnqueue(x - 1, y, d[p], d[p + 1], d[p + 2]);
    tryEnqueue(x + 1, y, d[p], d[p + 1], d[p + 2]);
    tryEnqueue(x, y - 1, d[p], d[p + 1], d[p + 2]);
    tryEnqueue(x, y + 1, d[p], d[p + 1], d[p + 2]);
  }
  /* 2px fringe — enough to hide the card edge, not enough to erase dark cloth. */
  const kill = new Uint8Array(w * h);
  for (let pass = 0; pass < 2; pass++) {
    kill.fill(0);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (d[i * 4 + 3] > 0 && (seen[i - 1] || seen[i + 1] || seen[i - w] || seen[i + w])) kill[i] = 1;
      }
    }
    for (let i = 0; i < kill.length; i++) {
      if (kill[i]) {
        d[i * 4 + 3] = 0;
        seen[i] = 1;
      }
    }
  }
}

/** Tight figure cutout. Unused plane pixels must be fully discarded — no pale or dark card. */
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
  floodKillCard(d, w, h, bg);

  const border = Math.max(8, Math.round(Math.min(w, h) * 0.03));
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x < border || y < border || x >= w - border || y >= h - border) {
        d[i + 3] = 0;
        continue;
      }
      if (isPaleCard(d[i], d[i + 1], d[i + 2])) d[i + 3] = 0;
      if (d[i + 3] > 48) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(image, 0, 0);

  if (maxX <= minX || maxY <= minY) return src;
  const pad = 2;
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
  const rim = 4;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      if (x < rim || y < rim || x >= cw - rim || y >= ch - rim || isPaleCard(cd[i], cd[i + 1], cd[i + 2])) {
        cd[i + 3] = 0;
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
