import * as THREE from "three";
import type { Quality } from "../game/types";

export const MAX_LANTERN_LIGHTS = 5;

export interface LightRig {
  moon: THREE.DirectionalLight;
  fill: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  lanterns: THREE.PointLight[];
  followRim: THREE.PointLight;
}

export function createLighting(scene: THREE.Scene, quality: Quality): LightRig {
  scene.environment = null;
  scene.fog = new THREE.FogExp2(0x081820, quality === "low" ? 0.012 : 0.0082);
  const ambient = new THREE.AmbientLight(0x243e4a, 0.86);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x3e6e7c, 0x0a1214, 1.18);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x9bb8bc, 0.92);
  moon.position.set(-18, 26, -2);
  moon.target.position.set(0, 0, 12);
  moon.castShadow = quality === "high";
  if (moon.castShadow) {
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.near = 2;
    moon.shadow.camera.far = 90;
    const s = 22;
    moon.shadow.camera.left = -s;
    moon.shadow.camera.right = s;
    moon.shadow.camera.top = s;
    moon.shadow.camera.bottom = -s;
    moon.shadow.bias = -0.0004;
  }
  scene.add(moon);
  scene.add(moon.target);
  const followRim = new THREE.PointLight(0xffc56a, 1.7, 4.8, 1.45);
  followRim.position.set(1.4, 1.8, 8.2);
  scene.add(followRim);
  return { moon, fill: hemi, ambient, lanterns: [], followRim };
}

export function lanternWarmth(lanterns: THREE.PointLight[], x: number, z: number): number {
  let best = 0;
  for (const light of lanterns) {
    const d = Math.hypot(light.position.x - x, light.position.z - z);
    best = Math.max(best, Math.max(0, 1 - d / 5.4));
  }
  return best;
}

export function addLanternLight(scene: THREE.Scene, rig: LightRig, x: number, y: number, z: number, quality: Quality): void {
  if (rig.lanterns.length >= MAX_LANTERN_LIGHTS) return;
  const intensity = quality === "low" ? 3.2 : 4.1;
  const light = new THREE.PointLight(0xff9a3c, intensity, 11.2, 1.12);
  light.position.set(x, y + 1.28, z);
  light.castShadow = false;
  scene.add(light);
  rig.lanterns.push(light);
}

export function applyQuality(renderer: THREE.WebGLRenderer, quality: Quality): void {
  renderer.shadowMap.enabled = quality === "high";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const dpr = typeof devicePixelRatio === "number" ? devicePixelRatio : 1;
  renderer.setPixelRatio(quality === "low" ? 1 : Math.min(dpr, 2));
}

/** Never assign a failed PMREM. Lights already keep Standard meshes visible. */
export function bakeNightEnv(_renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
  scene.environment = null;
}
