import * as THREE from "three";

function hash(ix: number, iz: number, seed: number): number {
  const n = Math.sin(ix * 127.1 + iz * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Large wet flagstones with grout — not a 5×5 speckle tile. */
export function makeWetStoneMaps(): { albedo: THREE.CanvasTexture; roughness: THREE.CanvasTexture } {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = albedo.height = size;
  const rough = document.createElement("canvas");
  rough.width = rough.height = size;
  const a = albedo.getContext("2d")!;
  const r = rough.getContext("2d")!;

  a.fillStyle = "#1a2026";
  a.fillRect(0, 0, size, size);
  r.fillStyle = "#d4d4d4";
  r.fillRect(0, 0, size, size);

  const cols = 3;
  const rows = 3;
  const cw = size / cols;
  const ch = size / rows;
  const grout = 13;
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const jx = (hash(ix, iz, 1) - 0.5) * 8;
      const jz = (hash(ix, iz, 2) - 0.5) * 8;
      const x = ix * cw + grout + jx;
      const z = iz * ch + grout + jz;
      const w = cw - grout * 2;
      const d = ch - grout * 2;
      const shade = 112 + hash(ix, iz, 5) * 20;
      const cool = hash(ix, iz, 6) * 8;
      a.fillStyle = `rgb(${(shade + 2) | 0},${(shade + 6) | 0},${(shade + 12 + cool) | 0})`;
      a.fillRect(x, z, w, d);
      a.strokeStyle = "rgba(10,12,14,0.5)";
      a.lineWidth = 5;
      a.strokeRect(x + 2, z + 2, w - 4, d - 4);
      if (hash(ix, iz, 10) > 0.35) {
        a.fillStyle = `rgba(198, 212, 224, ${0.05 + hash(ix, iz, 11) * 0.04})`;
        a.fillRect(x + w * 0.14, z + d * 0.16, w * 0.36, d * 0.07);
      }
      r.fillStyle = `rgb(${36 + hash(ix, iz, 12) * 16 | 0},40,40)`;
      r.fillRect(x + 4, z + 4, w - 8, d - 8);
    }
  }

  const albedoTex = new THREE.CanvasTexture(albedo);
  albedoTex.colorSpace = THREE.SRGBColorSpace;
  albedoTex.wrapS = albedoTex.wrapT = THREE.RepeatWrapping;
  albedoTex.anisotropy = 8;
  const roughTex = new THREE.CanvasTexture(rough);
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.anisotropy = 4;
  return { albedo: albedoTex, roughness: roughTex };
}

export function stoneClone(
  maps: { albedo: THREE.CanvasTexture; roughness: THREE.CanvasTexture },
  repeatX: number,
  repeatY: number,
  offsetX = 0,
  offsetY = 0,
): { map: THREE.Texture; roughnessMap: THREE.Texture } {
  const map = maps.albedo.clone();
  const roughnessMap = maps.roughness.clone();
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  roughnessMap.repeat.set(repeatX, repeatY);
  map.offset.set(offsetX, offsetY);
  roughnessMap.offset.set(offsetX, offsetY);
  map.needsUpdate = true;
  roughnessMap.needsUpdate = true;
  return { map, roughnessMap };
}

export function wetStoneMat(
  maps: { albedo: THREE.CanvasTexture; roughness: THREE.CanvasTexture },
  repeatX: number,
  repeatY: number,
  tint = 0x8a929c,
  offsetX = 0,
  offsetY = 0,
): THREE.MeshStandardMaterial {
  const { map, roughnessMap } = stoneClone(maps, repeatX, repeatY, offsetX, offsetY);
  return new THREE.MeshStandardMaterial({
    map,
    roughnessMap,
    color: tint,
    roughness: 0.5,
    metalness: 0.04,
    emissive: 0x000000,
    envMapIntensity: 0,
  });
}
