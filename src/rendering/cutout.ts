import * as THREE from "three";

function blurAlpha(data: Uint8ClampedArray, w: number, h: number, radius: number): void {
  const copy = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let oy = -radius; oy <= radius; oy++) {
        const yy = y + oy;
        if (yy < 0 || yy >= h) continue;
        for (let ox = -radius; ox <= radius; ox++) {
          const xx = x + ox;
          if (xx < 0 || xx >= w) continue;
          sum += copy[(yy * w + xx) * 4 + 3];
          n += 1;
        }
      }
      data[(y * w + x) * 4 + 3] = Math.round(sum / n);
    }
  }
}

function srcSize(img: TexImageSource): { w: number; h: number } {
  if ("width" in img && "height" in img) {
    return { w: Number(img.width), h: Number(img.height) };
  }
  return { w: 1024, h: 1536 };
}

/** Soft-figure cutout so painted full-frames stop reading as hard paper cards. */
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

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    const ny = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const nx = x / (w - 1);
      const ex = (nx - 0.5) / 0.28;
      const ey = (ny - 0.5) / 0.42;
      const e = ex * ex + ey * ey;
      let a = 1;
      if (e > 0.48) a = Math.max(0, 1 - (e - 0.48) / 0.55);
      const edge = Math.min(nx, 1 - nx, ny, 1 - ny);
      if (edge < 0.07) a *= edge / 0.07;
      const luma = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (e > 0.22 && luma < 40 && chroma < 16) a *= 0.08 + (luma / 40) * 0.28;
      const outA = Math.round(255 * Math.max(0, Math.min(1, a)));
      d[i + 3] = outA;
      if (outA > 18) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  blurAlpha(d, w, h, 2);
  ctx.putImageData(image, 0, 0);

  if (maxX <= minX || maxY <= minY) return src;
  const pad = 10;
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad) - x0;
  const ch = Math.min(h, maxY + pad) - y0;
  const cropped = document.createElement("canvas");
  cropped.width = cw;
  cropped.height = ch;
  const cctx = cropped.getContext("2d");
  if (!cctx) return src;
  cctx.drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);

  const tex = new THREE.CanvasTexture(cropped);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  tex.premultiplyAlpha = false;
  return tex;
}
