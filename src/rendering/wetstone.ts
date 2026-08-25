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

  a.fillStyle = "#14181c";
  a.fillRect(0, 0, size, size);
  r.fillStyle = "#cfcfcf";
  r.fillRect(0, 0, size, size);

  const cols = 3;
  const rows = 3;
  const cw = size / cols;
  const ch = size / rows;
  const grout = 16;
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const jx = (hash(ix, iz, 1) - 0.5) * 6;
      const jz = (hash(ix, iz, 2) - 0.5) * 6;
      const x = ix * cw + grout + jx;
      const z = iz * ch + grout + jz;
      const w = cw - grout * 2;
      const d = ch - grout * 2;
      const shade = 98 + hash(ix, iz, 5) * 18;
      const cool = hash(ix, iz, 6) * 10;
      a.fillStyle = `rgb(${(shade + 2) | 0},${(shade + 6) | 0},${(shade + 14 + cool) | 0})`;
      a.fillRect(x, z, w, d);
      a.strokeStyle = "rgba(8,10,12,0.62)";
      a.lineWidth = 7;
      a.strokeRect(x + 3, z + 3, w - 6, d - 6);
      a.strokeStyle = "rgba(170,184,196,0.08)";
      a.lineWidth = 2;
      a.strokeRect(x + 10, z + 10, w - 20, d - 20);
      r.fillStyle = `rgb(${34 + hash(ix, iz, 12) * 12 | 0},38,38)`;
      r.fillRect(x + 6, z + 6, w - 12, d - 12);
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
