import { dist2, norm2 } from "../math";
import { MAP_BOUNDS, OBSTACLES, PILLARS, groundHeight } from "../data/stages";
import type { Actor, Obstacle } from "../types";

export function collideActor(
  actor: Actor,
  others: Actor[],
  extras: Obstacle[] = OBSTACLES,
): void {
  let { x, z } = actor.pos;
  const r = actor.radius;

  for (const o of extras) {
    const d = dist2(x, z, o.x, o.z);
    const min = r + o.r;
    if (d < min && d > 1e-5) {
      const n = norm2(x - o.x, z - o.z);
      x = o.x + n.x * min;
      z = o.z + n.z * min;
    } else if (d <= 1e-5) {
      x += 0.05;
    }
  }

  for (const o of others) {
    if (o.id === actor.id || o.dead || o.hidden) continue;
    const d = dist2(x, z, o.pos.x, o.pos.z);
    const min = r + o.radius * 0.72;
    if (d < min && d > 1e-5) {
      const n = norm2(x - o.pos.x, z - o.pos.z);
      const push = (min - d) * (actor.kind === "player" ? 0.85 : 0.5);
      x += n.x * push;
      z += n.z * push;
    }
  }

  x = Math.max(MAP_BOUNDS.minX + r, Math.min(MAP_BOUNDS.maxX - r, x));
  z = Math.max(MAP_BOUNDS.minZ + r, Math.min(MAP_BOUNDS.maxZ - r, z));
  actor.pos.x = x;
  actor.pos.z = z;
  actor.pos.y = groundHeight(x, z);
}

export function wallCrash(
  prevX: number,
  prevZ: number,
  nextX: number,
  nextZ: number,
  radius: number,
): { hit: boolean; x: number; z: number } {
  for (const p of PILLARS) {
    const d = dist2(nextX, nextZ, p.x, p.z);
    if (d < p.r + radius + 0.12) {
      return { hit: true, x: p.x, z: p.z };
    }
  }
  for (const o of OBSTACLES) {
    if (o.kind === "lantern") continue;
    const d = dist2(nextX, nextZ, o.x, o.z);
    if (d < o.r + radius + 0.1) return { hit: true, x: o.x, z: o.z };
  }
  void prevX;
  void prevZ;
  return { hit: false, x: nextX, z: nextZ };
}

export function pointInCircle(x: number, z: number, cx: number, cz: number, r: number): boolean {
  return dist2(x, z, cx, cz) <= r;
}
