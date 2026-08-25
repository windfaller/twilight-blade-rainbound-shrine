import * as THREE from "three";

function hash(ix: number, iz: number, seed: number): number {
  const n = Math.sin(ix * 127.1 + iz * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

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
  r.fillStyle = "#c8c8c8";
  r.fillRect(0, 0, size, size);

  const cols = 5;
  const rows = 5;
  const cw = size / cols;
  const ch = size / rows;
  for (let iz = -1; iz <= rows; iz++) {
    for (let ix = -1; ix <= cols; ix++) {
      const jx = (hash(ix, iz, 1) - 0.5) * cw * 0.34;
      const jz = (hash(ix, iz, 2) - 0.5) * ch * 0.34;
      const x = ix * cw + jx + 4;
      const z = iz * ch + jz + 4;
      const w = cw * (0.72 + hash(ix, iz, 3) * 0.2);
      const d = ch * (0.7 + hash(ix, iz, 4) * 0.22);
      const shade = 58 + hash(ix, iz, 5) * 36;
      const cool = hash(ix, iz, 6) * 10;
      a.fillStyle = `rgb(${shade + 4 | 0},${shade + 6 | 0},${shade + 10 + cool | 0})`;
      a.fillRect(x, z, w, d);
      a.strokeStyle = `rgba(8,10,12,0.85)`;
      a.lineWidth = 3 + hash(ix, iz, 7) * 2;
      a.strokeRect(x, z, w, d);
      if (hash(ix, iz, 8) > 0.55) {
        a.fillStyle = `rgba(28, 52, 34, ${0.18 + hash(ix, iz, 9) * 0.22})`;
        a.fillRect(x - 2, z + d * 0.7, w + 4, 5);
      }
      if (hash(ix, iz, 10) > 0.62) {
        a.fillStyle = `rgba(210, 220, 230, ${0.05 + hash(ix, iz, 11) * 0.07})`;
        a.fillRect(x + w * 0.15, z + d * 0.18, w * 0.45, d * 0.12);
      }
      r.fillStyle = `rgb(${48 + hash(ix, iz, 12) * 36 | 0},${48 | 0},${48 | 0})`;
      r.fillRect(x + 2, z + 2, w - 4, d - 4);
      r.strokeStyle = "#dedede";
      r.lineWidth = 4;
      r.strokeRect(x, z, w, d);
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
    roughness: 0.42,
    metalness: 0.08,
    emissive: 0x000000,
    envMapIntensity: 0,
  });
}
