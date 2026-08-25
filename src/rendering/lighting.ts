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
  scene.fog = new THREE.FogExp2(0x15202c, quality === "low" ? 0.01 : 0.0065);
  const ambient = new THREE.AmbientLight(0x5a6a7c, 1.05);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x9ab0c8, 0x1c1812, 1.25);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xc8d8ee, 1.35);
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
  const followRim = new THREE.PointLight(0xffc56a, 2.8, 7.2, 1.6);
  followRim.position.set(1.4, 1.8, 8.2);
  scene.add(followRim);
  return { moon, fill: hemi, ambient, lanterns: [], followRim };
}

export function addLanternLight(scene: THREE.Scene, rig: LightRig, x: number, y: number, z: number, quality: Quality): void {
  if (rig.lanterns.length >= MAX_LANTERN_LIGHTS) return;
  const intensity = quality === "low" ? 3.2 : 3.8;
  const light = new THREE.PointLight(0xffb45a, intensity, 12.5, 1.08);
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
