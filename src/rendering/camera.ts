import * as THREE from "three";
import { lerp } from "../game/math";
import type { CameraSim, Vec3 } from "../game/types";

const ISO = THREE.MathUtils.degToRad(40);

export function createGameCamera(): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(36, 1, 0.2, 220);
  cam.position.set(10, 14, 10);
  return cam;
}

export function syncCamera(
  cam: THREE.PerspectiveCamera,
  sim: CameraSim,
  player: Vec3,
  aspect: number,
): void {
  cam.aspect = aspect;
  cam.updateProjectionMatrix();
  const yaw = Math.PI * 1.25 + sim.yawOffset;
  const dist = sim.zoom;
  const shakeX = (Math.random() - 0.5) * sim.shake;
  const shakeZ = (Math.random() - 0.5) * sim.shake;
  const tx = lerp(sim.lookX, player.x, 0.35) + shakeX;
  const tz = lerp(sim.lookZ, player.z, 0.35) + shakeZ;
  const ty = player.y + 0.4;
  const x = tx + Math.sin(yaw) * dist;
  const z = tz + Math.cos(yaw) * dist;
  const y = ty + Math.sin(ISO) * dist * 1.15;
  cam.position.set(x, y, z);
  cam.lookAt(tx, ty + 0.9, tz);
}

export function cameraYaw(sim: CameraSim): number {
  return Math.PI * 1.25 + sim.yawOffset;
}
