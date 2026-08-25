import { CHARACTERS } from "../data/characters";
import { approach, clamp, dist2, len2, norm2, shortestAngle } from "../math";
import type { Actor, CharacterId, InputFrame, PathState, SimState } from "../types";
import { collideActor } from "./collision";
import { followPath } from "./navigation";

export function applyMovement(state: SimState, input: InputFrame, dt: number): void {
  const p = state.player;
  if (p.dead) return;
  if (state.time < p.stunUntil) {
    p.vel.x *= 0.82;
    p.vel.z *= 0.82;
    integrate(p, dt, state);
    return;
  }
  if (state.time < p.anim.lockedUntil && p.anim.name !== "walk" && p.anim.name !== "run" && p.anim.name !== "idle") {
    if (p.anim.name !== "dodge") {
      p.vel.x *= 0.7;
      p.vel.z *= 0.7;
      integrate(p, dt, state);
      return;
    }
  }

  const kit = CHARACTERS[p.defId as CharacterId];
  let wishX = input.moveX;
  let wishZ = input.moveZ;
  const stick = len2(wishX, wishZ);

  if (stick > 0.12) {
    state.path.waypoints = [];
    state.path.index = 0;
  } else if (state.path.waypoints.length) {
    const follow = followPath(state.path.waypoints, state.path.index, p.pos.x, p.pos.z);
    state.path.index = follow.index;
    if (follow.done) {
      state.path.waypoints = [];
      wishX = 0;
      wishZ = 0;
    } else {
      wishX = follow.x;
      wishZ = follow.z;
    }
  }

  const mag = clamp(len2(wishX, wishZ), 0, 1);
  const n = norm2(wishX, wishZ);
  const running = mag > 0.72;
  const speed = (running ? kit.runSpeed : kit.moveSpeed) * (mag > 0 ? 1 : 0);
  const targetVx = n.x * speed * mag;
  const targetVz = n.z * speed * mag;
  const accel = mag > 0 ? 38 : 48;
  p.vel.x = approach(p.vel.x, targetVx, accel * dt);
  p.vel.z = approach(p.vel.z, targetVz, accel * dt);

  const spd = len2(p.vel.x, p.vel.z);
  if (spd > 0.35) {
    const face = Math.atan2(p.vel.x, p.vel.z);
    p.yaw += shortestAngle(p.yaw, face) * clamp(dt * 10, 0, 1);
    if (Math.abs(shortestAngle(p.yaw, face)) > 1.1 && spd < 2.4) {
      setAnim(p, "turn", state.time, 0);
    } else {
      setAnim(p, running ? "run" : "walk", state.time, 0);
    }
    p.anim.phase += dt * (running ? 9.2 : 7.2);
  } else if (p.anim.lockedUntil <= state.time) {
    setAnim(p, "idle", state.time, 0);
    p.anim.phase += dt * 2.2;
  }

  integrate(p, dt, state);
}

export function startDodge(state: SimState, input: InputFrame): boolean {
  const p = state.player;
  const kit = CHARACTERS[p.defId as CharacterId];
  if (state.time < p.cd.dodge || p.dead) return false;
  let dx = input.moveX;
  let dz = input.moveZ;
  if (len2(dx, dz) < 0.15) {
    dx = Math.sin(p.yaw);
    dz = Math.cos(p.yaw);
  }
  const n = norm2(dx, dz);
  p.vel.x = n.x * kit.dodgeSpeed;
  p.vel.z = n.z * kit.dodgeSpeed;
  p.iFramesUntil = state.time + kit.dodgeTime * 0.72;
  p.cd.dodge = state.time + 0.72;
  setAnim(p, "dodge", state.time, kit.dodgeTime);
  p.yaw = Math.atan2(n.x, n.z);
  state.sfx.push("dodge");
  return true;
}

export function integrate(actor: Actor, dt: number, state: SimState): void {
  actor.prevPos.x = actor.pos.x;
  actor.prevPos.y = actor.pos.y;
  actor.prevPos.z = actor.pos.z;
  actor.prevYaw = actor.yaw;
  actor.pos.x += actor.vel.x * dt;
  actor.pos.z += actor.vel.z * dt;
  collideActor(
    actor,
    state.actors.concat(state.player).filter((a) => a.id !== actor.id),
  );
}

export function setAnim(actor: Actor, name: Actor["anim"]["name"], now: number, lock: number): void {
  if (actor.anim.lockedUntil > now && lock <= 0) return;
  if (actor.anim.name !== name) {
    actor.anim.name = name;
    actor.anim.time = 0;
  }
  if (lock > 0) actor.anim.lockedUntil = now + lock;
}

export function setClickPath(path: PathState, waypoints: { x: number; z: number }[]): void {
  path.waypoints = waypoints;
  path.index = 0;
}

export function moveToward(actor: Actor, x: number, z: number, speed: number, dt: number): void {
  const d = dist2(actor.pos.x, actor.pos.z, x, z);
  if (d < 0.08) {
    actor.vel.x = 0;
    actor.vel.z = 0;
    return;
  }
  const n = norm2(x - actor.pos.x, z - actor.pos.z);
  actor.vel.x = n.x * speed;
  actor.vel.z = n.z * speed;
  actor.yaw = Math.atan2(n.x, n.z);
  actor.pos.x += actor.vel.x * dt;
  actor.pos.z += actor.vel.z * dt;
  actor.anim.phase += dt * 7;
  if (actor.anim.lockedUntil <= 0) {
    actor.anim.name = speed > 4.2 ? "run" : "walk";
  }
}
