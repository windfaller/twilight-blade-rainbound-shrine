import * as THREE from "three";
import type { Quality } from "../game/types";

export interface LightRig {
  moon: THREE.DirectionalLight;
  fill: THREE.HemisphereLight;
  rim: THREE.DirectionalLight;
  lanterns: THREE.PointLight[];
}

export function createLighting(scene: THREE.Scene, quality: Quality): LightRig {
  scene.fog = new THREE.FogExp2(0x0c121c, quality === "low" ? 0.016 : 0.011);
  const hemi = new THREE.HemisphereLight(0xa8c0d8, 0x1c1610, 1.05);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xdce8ff, 1.85);
  moon.position.set(-18, 28, 2);
  moon.target.position.set(0, 0, 14);
  moon.castShadow = quality !== "low";
  if (moon.castShadow) {
    moon.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
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
  const rim = new THREE.DirectionalLight(0xb4cce8, 0.95);
  rim.position.set(12, 8, 16);
  scene.add(rim);
  const bounce = new THREE.DirectionalLight(0x3a2a1c, 0.38);
  bounce.position.set(4, 2.2, 10);
  scene.add(bounce);
  const key = new THREE.PointLight(0xffc56a, 6.8, 12, 1.25);
  key.position.set(2.15, 2.35, 8.6);
  scene.add(key);
  const moonFill = new THREE.PointLight(0x9bb6d4, 2.6, 14, 1.5);
  moonFill.position.set(-3.4, 3.4, 6.8);
  scene.add(moonFill);
  return { moon, fill: hemi, rim, lanterns: [] };
}

export function addLanternLight(scene: THREE.Scene, rig: LightRig, x: number, y: number, z: number, quality: Quality): void {
  const intensity = quality === "low" ? 5.4 : 8.6;
  const light = new THREE.PointLight(0xffb45a, intensity, quality === "high" ? 16 : 12, 1.35);
  light.position.set(x, y + 1.28, z);
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
