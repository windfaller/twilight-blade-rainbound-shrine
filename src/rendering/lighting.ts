import * as THREE from "three";
import type { Quality } from "../game/types";

export interface LightRig {
  moon: THREE.DirectionalLight;
  fill: THREE.HemisphereLight;
  rim: THREE.DirectionalLight;
  lanterns: THREE.PointLight[];
  followRim: THREE.PointLight;
}

export function createLighting(scene: THREE.Scene, quality: Quality): LightRig {
  scene.fog = new THREE.FogExp2(0x0c1420, quality === "low" ? 0.014 : 0.009);
  const hemi = new THREE.HemisphereLight(0x6e88a8, 0x100c0a, 0.42);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xb8cce8, 1.15);
  moon.position.set(-20, 26, -2);
  moon.target.position.set(0, 0, 12);
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
  const rim = new THREE.DirectionalLight(0xd2e4f6, 0.85);
  rim.position.set(14, 7, 10);
  scene.add(rim);
  const followRim = new THREE.PointLight(0xffc56a, 3.2, 7.5, 1.6);
  followRim.position.set(1.4, 1.8, 8.2);
  scene.add(followRim);
  return { moon, fill: hemi, rim, lanterns: [], followRim };
}

export function addLanternLight(scene: THREE.Scene, rig: LightRig, x: number, y: number, z: number, quality: Quality): void {
  const intensity = quality === "low" ? 6.2 : 9.8;
  const light = new THREE.PointLight(0xffb45a, intensity, quality === "high" ? 9.5 : 7.5, 1.7);
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

export function bakeNightEnv(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x152033);
  const warm = new THREE.Mesh(
    new THREE.SphereGeometry(4, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffb45a }),
  );
  warm.position.set(6, 1.2, -8);
  const cool = new THREE.Mesh(
    new THREE.SphereGeometry(6, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x7ea0c4 }),
  );
  cool.position.set(-10, 8, 4);
  env.add(warm, cool);
  scene.environment = pmrem.fromScene(env, 0.08).texture;
  pmrem.dispose();
}
