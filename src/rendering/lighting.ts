import * as THREE from "three";
import type { Quality } from "../game/types";

export interface LightRig {
  moon: THREE.DirectionalLight;
  fill: THREE.HemisphereLight;
  lanterns: THREE.PointLight[];
}

export function createLighting(scene: THREE.Scene, quality: Quality): LightRig {
  scene.fog = new THREE.FogExp2(0x070b14, quality === "low" ? 0.018 : 0.013);
  const hemi = new THREE.HemisphereLight(0x9bb6d6, 0x1a120c, 0.55);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xd8e4ff, 1.15);
  moon.position.set(-18, 28, -8);
  moon.castShadow = quality !== "low";
  if (moon.castShadow) {
    moon.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
    moon.shadow.camera.near = 2;
    moon.shadow.camera.far = 90;
    const s = 28;
    moon.shadow.camera.left = -s;
    moon.shadow.camera.right = s;
    moon.shadow.camera.top = s;
    moon.shadow.camera.bottom = -s;
    moon.shadow.bias = -0.0004;
  }
  scene.add(moon);
  scene.add(moon.target);
  return { moon, fill: hemi, lanterns: [] };
}

export function addLanternLight(scene: THREE.Scene, rig: LightRig, x: number, y: number, z: number, quality: Quality): void {
  const intensity = quality === "low" ? 1.6 : 2.6;
  const light = new THREE.PointLight(0xffb45a, intensity, quality === "high" ? 16 : 11, 1.6);
  light.position.set(x, y + 1.35, z);
  if (quality === "high") {
    light.castShadow = true;
    light.shadow.mapSize.set(256, 256);
  }
  scene.add(light);
  rig.lanterns.push(light);
}

export function applyQuality(renderer: THREE.WebGLRenderer, quality: Quality): void {
  renderer.shadowMap.enabled = quality !== "low";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(quality === "high" ? Math.min(devicePixelRatio, 2) : quality === "med" ? 1.25 : 1);
}
