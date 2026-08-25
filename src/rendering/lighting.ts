import * as THREE from "three";
import type { Quality } from "../game/types";

export interface LightRig {
  moon: THREE.DirectionalLight;
  fill: THREE.HemisphereLight;
  rim: THREE.DirectionalLight;
  lanterns: THREE.PointLight[];
}

export function createLighting(scene: THREE.Scene, quality: Quality): LightRig {
  scene.fog = new THREE.FogExp2(0x141c28, quality === "low" ? 0.012 : 0.0075);
  const hemi = new THREE.HemisphereLight(0xc0d4e8, 0x241810, 1.35);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xe8f2ff, 2.25);
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
  const key = new THREE.PointLight(0xffc56a, 9.4, 14, 1.15);
  key.position.set(1.7, 2.15, 8.1);
  scene.add(key);
  const moonFill = new THREE.PointLight(0xb7cce4, 3.8, 16, 1.35);
  moonFill.position.set(-3.1, 3.6, 6.2);
  scene.add(moonFill);
  const stairKey = new THREE.PointLight(0xffd27a, 7.2, 18, 1.2);
  stairKey.position.set(0.4, 3.6, 12.2);
  scene.add(stairKey);
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
