import * as THREE from "three";

function hash(ix: number, seed: number): number {
  const n = Math.sin(ix * 127.1 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Dark wet boards with seams. Standard-only, no env map. */
export function makeWetWoodMaps(): { albedo: THREE.CanvasTexture; roughness: THREE.CanvasTexture } {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = albedo.height = size;
  const rough = document.createElement("canvas");
  rough.width = rough.height = size;
  const a = albedo.getContext("2d")!;
  const r = rough.getContext("2d")!;
  a.fillStyle = "#1a1410";
  a.fillRect(0, 0, size, size);
  r.fillStyle = "#b0b0b0";
  r.fillRect(0, 0, size, size);

  const boards = 8;
  const bw = size / boards;
  for (let i = 0; i < boards; i++) {
    const x = i * bw;
    const shade = 46 + hash(i, 1) * 16;
    a.fillStyle = `rgb(${(shade + 8) | 0},${(shade + 2) | 0},${(shade - 6) | 0})`;
    a.fillRect(x + 2, 0, bw - 4, size);
    a.fillStyle = "rgba(8,6,5,0.85)";
    a.fillRect(x, 0, 3, size);
    a.fillRect(x + bw - 2, 0, 2, size);
    if (hash(i, 4) > 0.4) {
      a.fillStyle = `rgba(210, 150, 70, ${0.04 + hash(i, 5) * 0.05})`;
      a.fillRect(x + bw * 0.25, size * 0.12, bw * 0.18, size * 0.7);
    }
    r.fillStyle = `rgb(${28 + hash(i, 6) * 10 | 0},30,30)`;
    r.fillRect(x + 4, 0, bw - 8, size);
    r.fillStyle = "#d8d8d8";
    r.fillRect(x, 0, 3, size);
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

export function wetWoodMat(
  maps: { albedo: THREE.CanvasTexture; roughness: THREE.CanvasTexture },
  repeatX: number,
  repeatY: number,
  tint = 0x3a2a1e,
  offsetX = 0,
): THREE.MeshStandardMaterial {
  const map = maps.albedo.clone();
  const roughnessMap = maps.roughness.clone();
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  roughnessMap.repeat.set(repeatX, repeatY);
  map.offset.set(offsetX, 0);
  roughnessMap.offset.set(offsetX, 0);
  map.needsUpdate = true;
  roughnessMap.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    map,
    roughnessMap,
    color: tint,
    roughness: 0.28,
    metalness: 0.08,
    emissive: 0x000000,
    envMapIntensity: 0,
  });
}
