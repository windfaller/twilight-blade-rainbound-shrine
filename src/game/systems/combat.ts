import { CHARACTERS } from "../data/characters";
import { ENEMIES } from "../data/enemies";
import { cooldownMul, critChance, ultMul } from "../data/relics";
import { clamp, dist2, len2, norm2 } from "../math";
import type {
  Actor,
  CharacterId,
  DamageKind,
  EnemyId,
  HitboxPulse,
  InputFrame,
  Projectile,
  SimState,
  VfxEvent,
} from "../types";
import { wallCrash } from "./collision";
import { setAnim } from "./movement";

let nid = 1;
function id(prefix: string): string {
  nid += 1;
  return `${prefix}-${nid}`;
}

export function resetCombatIds(): void {
  nid = 1;
}

function pushVfx(state: SimState, partial: Omit<VfxEvent, "id">): void {
  state.vfx.push({ id: id("vfx"), ...partial });
}

export function applyDamage(
  state: SimState,
  src: Actor | null,
  dst: Actor,
  raw: number,
  kind: DamageKind,
  knock: number,
  tags: string[],
): number {
  if (dst.dead || dst.hidden) return 0;
  if (dst.team === "player" && state.time < dst.iFramesUntil) return 0;
  const relics = state.relics;
  let amount = raw;
  const crit = Math.random() < critChance(relics);
  if (crit) amount *= 1.55;
  if (tags.includes("ult")) amount *= ultMul(relics);
  if (dst.shield > 0) {
    const absorb = Math.min(dst.shield, amount);
    dst.shield -= absorb;
    amount -= absorb;
  }
  dst.hp = Math.max(0, dst.hp - amount);
  const poiseHit = (crit && relics.includes("crit-break") ? 42 : 12) + (tags.includes("break") ? 28 : 0);
  dst.poise = Math.max(0, dst.poise - poiseHit);
  if (dst.poise <= 0 && dst.kind === "enemy") {
    dst.broken = true;
    dst.stunUntil = state.time + 1.35;
    dst.poise = ENEMIES[dst.defId as EnemyId]?.maxPoise ?? 30;
    dst.anim.name = "knockdown";
    dst.anim.lockedUntil = state.time + 1.2;
    state.sfx.push("break");
    pushVfx(state, { kind: "burst", x: dst.pos.x, y: dst.pos.y + 1.2, z: dst.pos.z, color: "#ffe08a", life: 0.45, scale: 1.4 });
  }

  if (src && knock > 0) {
    const n = norm2(dst.pos.x - src.pos.x, dst.pos.z - src.pos.z);
    const prevX = dst.pos.x;
    const prevZ = dst.pos.z;
    dst.pos.x += n.x * knock;
    dst.pos.z += n.z * knock;
    const crash = wallCrash(prevX, prevZ, dst.pos.x, dst.pos.z, dst.radius);
    if (crash.hit && relics.includes("wall-crash")) {
      dst.hp = Math.max(0, dst.hp - 22);
      dst.stunUntil = Math.max(dst.stunUntil, state.time + 0.45);
      amount += 22;
      pushVfx(state, { kind: "impact", x: crash.x, y: dst.pos.y + 1, z: crash.z, color: "#ffd27a", life: 0.3, scale: 1.1 });
    }
  }

  if (dst.team === "player") {
    setAnim(dst, amount > 18 ? "knockdown" : "hit", state.time, amount > 18 ? 0.45 : 0.22);
    if (dst.hp / dst.maxHp < 0.3 && relics.includes("last-stand-shield") && !state.lastStandUsed) {
      state.lastStandUsed = true;
      dst.shield += 45;
      pushVfx(state, { kind: "ward", x: dst.pos.x, y: dst.pos.y + 1, z: dst.pos.z, color: "#e0b45a", life: 0.7, scale: 1.6 });
    }
  } else {
    setAnim(dst, "hit", state.time, 0.18);
  }

  if (src?.team === "player" && relics.includes("foxfire-heal") && Math.random() < 0.22) {
    src.hp = Math.min(src.maxHp, src.hp + 6);
    pushVfx(state, { kind: "heal", x: src.pos.x, y: src.pos.y + 1.4, z: src.pos.z, color: "#ffb25a", life: 0.5, scale: 0.9 });
  }

  state.hitstop = Math.max(state.hitstop, crit ? 0.07 : 0.045);
  state.camera.shake = Math.max(state.camera.shake, clamp(amount / 80, 0.08, 0.32));
  pushVfx(state, {
    kind: "numbers",
    x: dst.pos.x + (Math.random() - 0.5) * 0.3,
    y: dst.pos.y + dst.height * 0.85,
    z: dst.pos.z,
    color: crit ? "#ffe08a" : "#f4f0e4",
    life: 0.7,
    scale: crit ? 1.25 : 1,
    text: `${Math.round(amount)}${crit ? "!" : ""}`,
  });
  pushVfx(state, { kind: "impact", x: dst.pos.x, y: dst.pos.y + 1.05, z: dst.pos.z, color: colorOf(kind), life: 0.28, scale: 1 });
  state.sfx.push("hit");
  state.combatLog.push({ t: state.time, kind: "hit", src: src?.id ?? "world", dst: dst.id, amount });

  if (dst.hp <= 0) {
    dst.dead = true;
    dst.anim.name = "defeat";
    dst.anim.lockedUntil = state.time + 2;
    state.killCount += 1;
    state.sfx.push("kill");
    state.combatLog.push({ t: state.time, kind: "kill", src: src?.id ?? "world", dst: dst.id, amount });
  }
  return amount;
}

function colorOf(kind: DamageKind): string {
  switch (kind) {
    case "moon":
      return "#d8e7ff";
    case "fire":
      return "#ff8a3a";
    case "holy":
      return "#ffe08a";
    case "blood":
      return "#ff4d6a";
    case "spirit":
      return "#7fe7ff";
    default:
      return "#f0e6d2";
  }
}

function spawnPulse(state: SimState, pulse: Omit<HitboxPulse, "hitIds">): void {
  state.pulses.push({ ...pulse, hitIds: [] });
}

function spawnProj(state: SimState, p: Omit<Projectile, "id">): void {
  state.projectiles.push({ id: id("prj"), ...p });
}

export function tryPlayerAttack(state: SimState, input: InputFrame): void {
  const p = state.player;
  if (p.dead || state.time < p.stunUntil) return;
  const kit = CHARACTERS[p.defId as CharacterId];
  if (input.attack && state.time >= p.cd.auto && state.time >= p.anim.lockedUntil) {
    if (state.time > p.comboExpire) p.attackSeq = 0;
    const step = p.attackSeq % 3;
    const dmg = kit.autos[step];
    const lock = 0.28 + step * 0.06;
    const names = ["aa1", "aa2", "aa3"] as const;
    setAnim(p, names[step], state.time, lock);
    p.cd.auto = state.time + 0.34;
    p.comboExpire = state.time + 0.85;
    p.attackSeq = step + 1;
    const dir = { x: Math.sin(p.yaw), z: Math.cos(p.yaw) };
    if (kit.autoRange > 3.2) {
      spawnProj(state, {
        ownerId: p.id,
        team: "player",
        x: p.pos.x + dir.x * 0.6,
        y: p.pos.y + 1.15,
        z: p.pos.z + dir.z * 0.6,
        vx: dir.x * 16,
        vz: dir.z * 16,
        life: 0.7,
        radius: 0.32,
        damage: dmg,
        kind: kit.autoKind,
        style: kit.id === "kuzuha" ? "foxfire" : kit.id === "vivienne" ? "bolt" : "qi",
        pierce: 0,
        homing: kit.id === "kuzuha" ? nearestEnemyId(state, p) ?? undefined : undefined,
      });
      state.sfx.push("cast");
    } else {
      spawnPulse(state, {
        ownerId: p.id,
        team: "player",
        x: p.pos.x + dir.x * 1.15,
        z: p.pos.z + dir.z * 1.15,
        radius: kit.autoRange * 0.72,
        damage: dmg,
        kind: kit.autoKind,
        knock: 0.55 + step * 0.15,
        poise: 8 + step * 4,
        tags: step === 2 ? ["aa3"] : ["aa"],
        until: state.time + 0.12,
      });
      state.sfx.push("slash");
      pushVfx(state, {
        kind: "slash",
        x: p.pos.x + dir.x,
        y: p.pos.y + 1.1,
        z: p.pos.z + dir.z,
        color: kit.accent,
        life: 0.2,
        scale: 1 + step * 0.15,
      });
      if (step === 2 && state.relics.includes("aa3-wave")) {
        spawnProj(state, {
          ownerId: p.id,
          team: "player",
          x: p.pos.x + dir.x,
          y: p.pos.y + 1,
          z: p.pos.z + dir.z,
          vx: dir.x * 14,
          vz: dir.z * 14,
          life: 0.55,
          radius: 0.7,
          damage: dmg * 0.7,
          kind: kit.autoKind,
          style: "wave",
          pierce: 3,
        });
      }
    }
  }

  for (let i = 0; i < 3; i++) {
    if (!input.skills[i]) continue;
    trySkill(state, i as 0 | 1 | 2);
  }
}

export function trySkill(state: SimState, slot: 0 | 1 | 2): boolean {
  const p = state.player;
  const kit = CHARACTERS[p.defId as CharacterId];
  const sk = kit.skills[slot];
  const cdMul = cooldownMul(state.relics);
  if (state.time < p.cd.skills[slot] || p.spirit < sk.spirit || p.dead) return false;
  if (state.time < p.anim.lockedUntil && p.anim.name !== "idle" && p.anim.name !== "walk" && p.anim.name !== "run") {
    return false;
  }
  p.spirit -= sk.spirit;
  p.cd.skills[slot] = state.time + sk.cooldown * cdMul;
  const lock = sk.startup + sk.active + sk.recover;
  setAnim(p, slot === 2 ? "ult" : slot === 0 ? "skill1" : "skill2", state.time, lock);
  if (slot === 2) {
    state.ultCutIn = 0.85;
    state.sfx.push("ult");
    state.musicCue = "ult";
  } else state.sfx.push("skill");

  const dir = { x: Math.sin(p.yaw), z: Math.cos(p.yaw) };
  const tgt = nearestEnemy(state, p);

  if (sk.tags.includes("blink") || sk.tags.includes("dash")) {
    const dist = sk.range;
    p.pos.x += dir.x * dist * 0.85;
    p.pos.z += dir.z * dist * 0.85;
    p.iFramesUntil = state.time + 0.18;
    spawnPulse(state, {
      ownerId: p.id,
      team: "player",
      x: p.pos.x,
      z: p.pos.z,
      radius: sk.radius,
      damage: sk.damage,
      kind: sk.kind,
      knock: 0.7,
      poise: 10,
      tags: sk.tags,
      until: state.time + sk.active,
    });
  } else if (sk.tags.includes("parry")) {
    p.iFramesUntil = state.time + sk.active;
    p.shield += 18;
    spawnPulse(state, {
      ownerId: p.id,
      team: "player",
      x: p.pos.x + dir.x * 1.1,
      z: p.pos.z + dir.z * 1.1,
      radius: sk.radius,
      damage: sk.damage,
      kind: sk.kind,
      knock: 1.1,
      poise: 30,
      tags: [...sk.tags, "break"],
      until: state.time + sk.active,
    });
  } else if (sk.tags.includes("fan")) {
    for (let k = -2; k <= 2; k++) {
      const a = p.yaw + k * 0.18;
      spawnProj(state, {
        ownerId: p.id,
        team: "player",
        x: p.pos.x,
        y: p.pos.y + 1.1,
        z: p.pos.z,
        vx: Math.sin(a) * 18,
        vz: Math.cos(a) * 18,
        life: 0.55,
        radius: 0.22,
        damage: sk.damage,
        kind: sk.kind,
        style: "kunai",
        pierce: 1,
      });
    }
  } else if (sk.tags.includes("ward")) {
    p.shield += 28;
    spawnPulse(state, {
      ownerId: p.id,
      team: "player",
      x: p.pos.x,
      z: p.pos.z,
      radius: sk.radius,
      damage: sk.damage,
      kind: sk.kind,
      knock: 0.2,
      poise: 8,
      tags: sk.tags,
      until: state.time + 0.25,
    });
    pushVfx(state, { kind: "ward", x: p.pos.x, y: p.pos.y + 1, z: p.pos.z, color: "#ffe0a0", life: 0.8, scale: 2 });
  } else if (sk.tags.includes("heal")) {
    p.hp = Math.min(p.maxHp, p.hp + 28);
    spawnPulse(state, {
      ownerId: p.id,
      team: "player",
      x: p.pos.x,
      z: p.pos.z,
      radius: sk.radius,
      damage: sk.damage,
      kind: sk.kind,
      knock: 0.4,
      poise: 16,
      tags: sk.tags,
      until: state.time + sk.active,
    });
  } else if (sk.tags.includes("trap")) {
    const tx = tgt ? tgt.pos.x : p.pos.x + dir.x * 5;
    const tz = tgt ? tgt.pos.z : p.pos.z + dir.z * 5;
    spawnPulse(state, {
      ownerId: p.id,
      team: "player",
      x: tx,
      z: tz,
      radius: sk.radius,
      damage: sk.damage,
      kind: sk.kind,
      knock: 0.5,
      poise: 12,
      tags: sk.tags,
      until: state.time + 0.9,
    });
    pushVfx(state, { kind: "telegraph", x: tx, y: 5.2, z: tz, color: "#ff4d6a", life: 0.9, scale: sk.radius });
  } else if (sk.tags.includes("orbit")) {
    p.shield += 8;
    for (let k = 0; k < 3; k++) {
      const a = p.yaw + (k * Math.PI * 2) / 3;
      spawnProj(state, {
        ownerId: p.id,
        team: "player",
        x: p.pos.x + Math.sin(a) * 1.6,
        y: p.pos.y + 1.2,
        z: p.pos.z + Math.cos(a) * 1.6,
        vx: Math.sin(a + 1.2) * 7,
        vz: Math.cos(a + 1.2) * 7,
        life: 3.2,
        radius: 0.35,
        damage: sk.damage,
        kind: sk.kind,
        style: "qi",
        pierce: 8,
      });
    }
  } else if (sk.tags.includes("clone")) {
    if (tgt) {
      spawnPulse(state, {
        ownerId: p.id,
        team: "player",
        x: tgt.pos.x,
        z: tgt.pos.z,
        radius: sk.radius,
        damage: sk.damage,
        kind: sk.kind,
        knock: 0.8,
        poise: 14,
        tags: sk.tags,
        until: state.time + 0.35,
      });
    }
    pushVfx(state, { kind: "clone", x: p.pos.x, y: p.pos.y + 1, z: p.pos.z, color: "#ff4d6a", life: 0.6, scale: 1.4 });
  } else if (sk.tags.includes("ult") && sk.tags.includes("aoe")) {
    const tx = tgt ? tgt.pos.x : p.pos.x;
    const tz = tgt ? tgt.pos.z : p.pos.z;
    spawnPulse(state, {
      ownerId: p.id,
      team: "player",
      x: tx,
      z: tz,
      radius: sk.radius,
      damage: sk.damage,
      kind: sk.kind,
      knock: 1.2,
      poise: sk.tags.includes("break") ? 50 : 22,
      tags: sk.tags,
      until: state.time + sk.active,
    });
    pushVfx(state, { kind: "ult", x: tx, y: p.pos.y + 1.4, z: tz, color: kit.accent, life: 0.8, scale: 2.2 });
  } else {
    spawnPulse(state, {
      ownerId: p.id,
      team: "player",
      x: p.pos.x + dir.x * Math.min(sk.range, 2.4),
      z: p.pos.z + dir.z * Math.min(sk.range, 2.4),
      radius: sk.radius,
      damage: sk.damage,
      kind: sk.kind,
      knock: 0.8,
      poise: 12,
      tags: sk.tags,
      until: state.time + sk.active,
    });
  }
  return true;
}

function nearestEnemy(state: SimState, from: Actor): Actor | null {
  let best: Actor | null = null;
  let bd = 18;
  for (const a of state.actors) {
    if (a.team !== "enemy" || a.dead) continue;
    const d = dist2(from.pos.x, from.pos.z, a.pos.x, a.pos.z);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best;
}

function nearestEnemyId(state: SimState, from: Actor): string | null {
  return nearestEnemy(state, from)?.id ?? null;
}

export function stepProjectiles(state: SimState, dt: number): void {
  const live: Projectile[] = [];
  for (const p of state.projectiles) {
    if (p.homing) {
      const t = state.actors.find((a) => a.id === p.homing && !a.dead);
      if (t) {
        const n = norm2(t.pos.x - p.x, t.pos.z - p.z);
        p.vx = p.vx * 0.86 + n.x * 16 * 0.14;
        p.vz = p.vz * 0.86 + n.z * 16 * 0.14;
      }
    }
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.life -= dt;
    if (p.life <= 0) continue;
    const targets = p.team === "player" ? state.actors : [state.player];
    let consumed = false;
    for (const t of targets) {
      if (t.dead || t.team === p.team) continue;
      if (dist2(p.x, p.z, t.pos.x, t.pos.z) <= p.radius + t.radius) {
        const src = p.team === "player" ? state.player : state.actors.find((a) => a.id === p.ownerId) ?? null;
        applyDamage(state, src, t, p.damage, p.kind, 0.35, [p.style]);
        p.pierce -= 1;
        if (p.pierce < 0) {
          consumed = true;
          break;
        }
      }
    }
    if (!consumed) live.push(p);
  }
  state.projectiles = live;
}

export function stepPulses(state: SimState): void {
  const live: HitboxPulse[] = [];
  for (const pulse of state.pulses) {
    if (state.time > pulse.until) continue;
    const targets = pulse.team === "player" ? state.actors : [state.player];
    const src =
      pulse.team === "player"
        ? state.player
        : state.actors.find((a) => a.id === pulse.ownerId) ?? null;
    for (const t of targets) {
      if (t.dead || pulse.hitIds.includes(t.id)) continue;
      if (dist2(pulse.x, pulse.z, t.pos.x, t.pos.z) <= pulse.radius + t.radius) {
        pulse.hitIds.push(t.id);
        applyDamage(state, src, t, pulse.damage, pulse.kind, pulse.knock, pulse.tags);
      }
    }
    live.push(pulse);
  }
  state.pulses = live;
}

export function stepEnemyAi(state: SimState, dt: number): void {
  const player = state.player;
  for (const e of state.actors) {
    if (e.kind !== "enemy" || e.dead) continue;
    e.prevPos.x = e.pos.x;
    e.prevPos.y = e.pos.y;
    e.prevPos.z = e.pos.z;
    e.prevYaw = e.yaw;
    if (state.time < e.stunUntil) {
      e.vel.x *= 0.8;
      e.vel.z *= 0.8;
      e.pos.x += e.vel.x * dt;
      e.pos.z += e.vel.z * dt;
      continue;
    }
    const def = ENEMIES[e.defId as EnemyId];
    const d = dist2(e.pos.x, e.pos.z, player.pos.x, player.pos.z);
    e.yaw = Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z);
    const ai = e.ai ?? { targetId: player.id, nextThink: 0, nextAttack: 0, mode: "chase", chargeUntil: 0 };
    e.ai = ai;

    if (e.defId === "archer" || e.defId === "caster") {
      if (d < 4.5) {
        const n = norm2(e.pos.x - player.pos.x, e.pos.z - player.pos.z);
        e.pos.x += n.x * def.moveSpeed * dt;
        e.pos.z += n.z * def.moveSpeed * dt;
        e.anim.name = "walk";
      } else if (d > def.range) {
        const n = norm2(player.pos.x - e.pos.x, player.pos.z - e.pos.z);
        e.pos.x += n.x * def.moveSpeed * dt;
        e.pos.z += n.z * def.moveSpeed * dt;
        e.anim.name = "walk";
      } else if (state.time >= ai.nextAttack) {
        beginEnemyAttack(state, e, def);
      } else if (e.anim.lockedUntil <= state.time) {
        e.anim.name = "idle";
      }
    } else if (e.defId === "elite" || e.defId === "boss") {
      stepHeavy(state, e, def, dt, d);
    } else {
      if (d > def.range * 0.9) {
        const n = norm2(player.pos.x - e.pos.x, player.pos.z - e.pos.z);
        e.pos.x += n.x * def.moveSpeed * dt;
        e.pos.z += n.z * def.moveSpeed * dt;
        e.anim.name = "walk";
        e.anim.phase += dt * 7;
      } else if (state.time >= ai.nextAttack) {
        beginEnemyAttack(state, e, def);
      }
    }
    e.pos.y = player.pos.y;
    if (e.telegraph && state.time > e.telegraph.until) e.telegraph = null;
  }
}

function beginEnemyAttack(state: SimState, e: Actor, def: (typeof ENEMIES)[EnemyId]): void {
  const ai = e.ai!;
  setAnim(e, "aa1", state.time, def.startup + def.active + def.recover);
  ai.nextAttack = state.time + def.startup + def.active + def.recover + 0.35;
  e.telegraph = {
    kind: e.defId === "caster" ? "circle" : e.defId === "archer" ? "line" : "cone",
    x: e.pos.x,
    z: e.pos.z,
    yaw: e.yaw,
    length: def.range,
    width: e.defId === "caster" ? 3.2 : 1.6,
    until: state.time + def.startup,
    danger: 1,
  };
  windowSetTimeoutAttack(state, e, def);
}

function windowSetTimeoutAttack(state: SimState, e: Actor, def: (typeof ENEMIES)[EnemyId]): void {
  const fireAt = state.time + def.startup;
  e.ai!.chargeUntil = fireAt;
  e.ai!.mode = "windup";
  (e as Actor & { pendingFire?: number }).pendingFire = fireAt;
}

export function resolveEnemyAttacks(state: SimState): void {
  for (const e of state.actors) {
    if (e.kind !== "enemy" || e.dead) continue;
    const pending = (e as Actor & { pendingFire?: number }).pendingFire;
    if (pending && state.time >= pending) {
      (e as Actor & { pendingFire?: number }).pendingFire = undefined;
      fireEnemy(state, e);
    }
  }
}

function fireEnemy(state: SimState, e: Actor): void {
  const def = ENEMIES[e.defId as EnemyId];
  const dir = { x: Math.sin(e.yaw), z: Math.cos(e.yaw) };
  if (e.defId === "archer") {
    spawnProj(state, {
      ownerId: e.id,
      team: "enemy",
      x: e.pos.x,
      y: e.pos.y + 1.2,
      z: e.pos.z,
      vx: dir.x * 13,
      vz: dir.z * 13,
      life: 1.3,
      radius: 0.22,
      damage: def.damage,
      kind: "spirit",
      style: "ofuda",
      pierce: 0,
    });
  } else if (e.defId === "caster") {
    spawnPulse(state, {
      ownerId: e.id,
      team: "enemy",
      x: state.player.pos.x,
      z: state.player.pos.z,
      radius: 2.8,
      damage: def.damage,
      kind: "spirit",
      knock: 0.7,
      poise: 8,
      tags: ["cast"],
      until: state.time + 0.2,
    });
  } else {
    spawnPulse(state, {
      ownerId: e.id,
      team: "enemy",
      x: e.pos.x + dir.x * 1.3,
      z: e.pos.z + dir.z * 1.3,
      radius: def.range * 0.7,
      damage: def.damage,
      kind: def.kind,
      knock: 0.55,
      poise: 6,
      tags: ["melee"],
      until: state.time + def.active,
    });
  }
  e.telegraph = null;
  state.sfx.push("enemy");
}

function stepHeavy(state: SimState, e: Actor, def: (typeof ENEMIES)[EnemyId], dt: number, d: number): void {
  const ai = e.ai!;
  const player = state.player;
  const phase = e.phase;
  if (e.defId === "boss" && e.hp <= e.maxHp * 0.5 && phase < 2) {
    beginBossPhase2(state, e);
  }
  const mix = phase >= 2 ? 1 : 0;
  if (state.time < e.anim.lockedUntil) return;
  if (d > def.range + 0.4) {
    const n = norm2(player.pos.x - e.pos.x, player.pos.z - e.pos.z);
    e.pos.x += n.x * def.moveSpeed * dt;
    e.pos.z += n.z * def.moveSpeed * dt;
    e.anim.name = "walk";
    if (e.defId === "elite" && d > 6 && state.time > ai.nextAttack + 0.2) {
      ai.mode = "charge";
      setAnim(e, "skill1", state.time, 0.9);
      e.vel.x = n.x * 11;
      e.vel.z = n.z * 11;
      e.telegraph = { kind: "line", x: e.pos.x, z: e.pos.z, yaw: e.yaw, length: 9, width: 1.4, until: state.time + 0.35, danger: 1 };
      ai.nextAttack = state.time + 2.2;
      (e as Actor & { pendingFire?: number }).pendingFire = state.time + 0.32;
    }
    return;
  }
  const roll = Math.random();
  if (e.defId === "boss" && roll < 0.28 + mix * 0.1) {
    setAnim(e, "skill2", state.time, 1.15);
    e.telegraph = { kind: "line", x: e.pos.x, z: e.pos.z, yaw: e.yaw, length: 11 + mix * 2, width: 1.3, until: state.time + 0.42, danger: 1 };
    (e as Actor & { pendingFire?: number }).pendingFire = state.time + 0.42;
    ai.nextAttack = state.time + 2.4;
    spawnProj(state, {
      ownerId: e.id,
      team: "enemy",
      x: e.pos.x,
      y: e.pos.y + 1.4,
      z: e.pos.z,
      vx: Math.sin(e.yaw) * (12 + mix * 3),
      vz: Math.cos(e.yaw) * (12 + mix * 3),
      life: 0.9,
      radius: 0.45,
      damage: def.damage + 4,
      kind: "spirit",
      style: "wave",
      pierce: 2,
    });
  } else if (e.defId === "boss" && roll < 0.5 && mix) {
    for (let k = 0; k < 2; k++) {
      spawnPulse(state, {
        ownerId: e.id,
        team: "enemy",
        x: e.pos.x + Math.sin(e.yaw + (k - 0.5)) * 3,
        z: e.pos.z + Math.cos(e.yaw + (k - 0.5)) * 3,
        radius: 1.8,
        damage: def.damage + 2,
        kind: "spirit",
        knock: 0.9,
        poise: 10,
        tags: ["ghost-blade"],
        until: state.time + 0.25,
      });
    }
    setAnim(e, "aa2", state.time, 0.7);
    ai.nextAttack = state.time + 1.6;
  } else if (e.defId === "boss" && roll < 0.62) {
    spawnMinion(state, e);
    setAnim(e, "skill1", state.time, 0.8);
    ai.nextAttack = state.time + 3.2;
  } else if (e.defId === "elite" && roll < 0.4) {
    e.telegraph = { kind: "cone", x: e.pos.x, z: e.pos.z, yaw: e.yaw, length: 5.5, width: 1.8, until: state.time + 0.48, danger: 1 };
    setAnim(e, "aa3", state.time, 1.05);
    (e as Actor & { pendingFire?: number }).pendingFire = state.time + 0.48;
    ai.nextAttack = state.time + 2.1;
  } else {
    beginEnemyAttack(state, e, def);
  }
}

function spawnMinion(state: SimState, boss: Actor): void {
  const existing = state.actors.filter((a) => a.defId === "yokai" && !a.dead).length;
  if (existing >= 3) return;
  const a = Math.random() * Math.PI * 2;
  const e = makeEnemyActor("yokai", boss.pos.x + Math.cos(a) * 3.2, boss.pos.z + Math.sin(a) * 3.2, state.time);
  state.actors.push(e);
  pushVfx(state, { kind: "burst", x: e.pos.x, y: e.pos.y + 1, z: e.pos.z, color: "#6ecbff", life: 0.4, scale: 1.2 });
}

export function beginBossPhase2(state: SimState, boss: Actor): void {
  boss.phase = 2;
  state.bossPhase = 2;
  state.arenaBroken = true;
  state.musicCue = "boss2";
  state.camera.shake = 0.7;
  boss.poise = ENEMIES.boss.maxPoise;
  boss.broken = false;
  setAnim(boss, "ult", state.time, 1.4);
  pushVfx(state, { kind: "ult", x: boss.pos.x, y: boss.pos.y + 1.6, z: boss.pos.z, color: "#6ecbff", life: 1.1, scale: 3 });
  state.sfx.push("phase");
  state.combatLog.push({ t: state.time, kind: "phase", src: boss.id, dst: boss.id, amount: 2 });
}

export function makeEnemyActor(defId: EnemyId, x: number, z: number, now: number): Actor {
  const def = ENEMIES[defId];
  return {
    id: id(defId),
    defId,
    kind: "enemy",
    team: "enemy",
    name: def.name,
    pos: { x, y: 5, z },
    prevPos: { x, y: 5, z },
    vel: { x: 0, y: 0, z: 0 },
    yaw: 0,
    prevYaw: 0,
    hp: def.maxHp,
    maxHp: def.maxHp,
    spirit: 0,
    maxSpirit: 0,
    poise: def.maxPoise,
    maxPoise: def.maxPoise,
    shield: 0,
    radius: def.radius,
    height: def.height,
    anim: { name: "idle", time: 0, lockedUntil: 0, phase: Math.random() * 4 },
    cd: { dodge: 0, auto: 0, skills: [0, 0, 0] },
    iFramesUntil: 0,
    stunUntil: 0,
    dead: false,
    hidden: false,
    attackSeq: 0,
    comboExpire: 0,
    telegraph: null,
    ai: { targetId: "player", nextThink: now, nextAttack: now + 0.6, mode: "chase", chargeUntil: 0 },
    broken: false,
    phase: 1,
  };
}

export function spawnDodgeClone(state: SimState): void {
  if (!state.relics.includes("perfect-dodge-clone")) return;
  const p = state.player;
  spawnPulse(state, {
    ownerId: p.id,
    team: "player",
    x: p.pos.x,
    z: p.pos.z,
    radius: 1.5,
    damage: 16,
    kind: "moon",
    knock: 0.4,
    poise: 8,
    tags: ["clone"],
    until: state.time + 0.25,
  });
  pushVfx(state, { kind: "clone", x: p.pos.x, y: p.pos.y + 1, z: p.pos.z, color: "#d8e7ff", life: 0.5, scale: 1.1 });
}

export function tickRegen(state: SimState, dt: number): void {
  const p = state.player;
  if (p.dead) return;
  p.spirit = Math.min(p.maxSpirit, p.spirit + dt * (state.blessing ? 7.5 : 5.2));
  p.anim.time += dt;
  if (state.ultCutIn > 0) state.ultCutIn = Math.max(0, state.ultCutIn - dt);
  for (const a of state.actors) a.anim.time += dt;
}

export function livingEnemies(state: SimState): Actor[] {
  return state.actors.filter((a) => a.kind === "enemy" && !a.dead);
}

export function aimDirFromInput(p: Actor, input: InputFrame): { x: number; z: number } {
  if (len2(input.moveX, input.moveZ) > 0.2) return norm2(input.moveX, input.moveZ);
  return { x: Math.sin(p.yaw), z: Math.cos(p.yaw) };
}
