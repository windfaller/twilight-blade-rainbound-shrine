import * as THREE from "three";
import { lerp } from "../game/math";
import type { CameraSim, Vec3 } from "../game/types";

const ISO = THREE.MathUtils.degToRad(34);
const LOOK_AHEAD = 1.55;

export function createGameCamera(): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(30, 1, 0.2, 240);
  cam.position.set(6, 9, 6);
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
  const tz = lerp(sim.lookZ, player.z + LOOK_AHEAD, 0.42) + shakeZ;
  const ty = player.y + 0.22;
  const x = tx + Math.sin(yaw) * dist;
  const z = tz + Math.cos(yaw) * dist;
  const y = ty + Math.sin(ISO) * dist * 0.92;
  cam.position.set(x, y, z);
  cam.lookAt(tx + 0.35, ty + 1.15, tz);
}

export function cameraYaw(sim: CameraSim): number {
  return Math.PI * 1.25 + sim.yawOffset;
}
