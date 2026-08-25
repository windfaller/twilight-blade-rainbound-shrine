import type { Actor } from "../game/types";

export interface RigPose {
  hipY: number;
  hipRoll: number;
  torsoBend: number;
  headYaw: number;
  hairSwing: number;
  hemSwing: number;
  lLeg: number;
  rLeg: number;
  lArm: number;
  rArm: number;
  weapon: number;
  squash: number;
}

export function poseFromActor(a: Actor, alpha: number): RigPose {
  const t = a.anim.phase + a.anim.time * 2;
  const idle = {
    hipY: Math.sin(t * 1.6) * 0.02,
    hipRoll: Math.sin(t * 0.8) * 0.02,
    torsoBend: Math.sin(t) * 0.015,
    headYaw: Math.sin(t * 0.5) * 0.04,
    hairSwing: Math.sin(t * 1.3) * 0.14,
    hemSwing: Math.sin(t * 1.7) * 0.12,
    lLeg: 0,
    rLeg: 0,
    lArm: Math.sin(t) * 0.04,
    rArm: -Math.sin(t) * 0.04,
    weapon: Math.sin(t * 0.9) * 0.05,
    squash: 1,
  };
  const n = a.anim.name;
  if (n === "walk" || n === "run") {
    const amp = n === "run" ? 0.55 : 0.38;
    const s = Math.sin(t);
    return {
      ...idle,
      hipY: Math.abs(Math.sin(t)) * (n === "run" ? 0.07 : 0.045),
      hipRoll: s * 0.08,
      lLeg: s * amp,
      rLeg: -s * amp,
      lArm: -s * amp * 0.7,
      rArm: s * amp * 0.7,
      hairSwing: -s * 0.28,
      hemSwing: s * 0.32,
      weapon: s * 0.22,
    };
  }
  if (n === "turn") {
    return { ...idle, hipRoll: Math.sin(t * 4) * 0.12, headYaw: Math.sin(t * 3) * 0.2 };
  }
  if (n === "aa1" || n === "aa2" || n === "aa3") {
    const k = n === "aa3" ? 1.25 : n === "aa2" ? 1 : 0.85;
    const swing = Math.sin(Math.min(1, a.anim.time / 0.22) * Math.PI) * k;
    return {
      ...idle,
      rArm: -0.9 * swing,
      weapon: -1.4 * swing,
      torsoBend: 0.15 * swing,
      lLeg: 0.15,
      hipY: 0.03,
    };
  }
  if (n === "skill1" || n === "skill2" || n === "ult") {
    const swing = Math.sin(Math.min(1, a.anim.time / 0.3) * Math.PI);
    return {
      ...idle,
      rArm: -1.1 * swing,
      lArm: 0.4 * swing,
      weapon: -1.6 * swing,
      hairSwing: swing * 0.3,
      hemSwing: swing * 0.25,
      squash: 1 + swing * 0.04,
    };
  }
  if (n === "dodge") {
    return { ...idle, hipY: 0.12, torsoBend: 0.25, hairSwing: 0.35, hemSwing: 0.3, lLeg: 0.4, rLeg: -0.15, squash: 0.94 };
  }
  if (n === "hit") {
    return { ...idle, torsoBend: -0.18, headYaw: 0.12, squash: 0.96 };
  }
  if (n === "knockdown" || n === "defeat") {
    return { ...idle, torsoBend: 0.45, hipY: -0.08, squash: 0.9, hairSwing: 0.2 };
  }
  if (n === "victory") {
    return { ...idle, rArm: -0.8, weapon: -0.9, hipY: 0.05 + Math.abs(Math.sin(t)) * 0.03 };
  }
  void alpha;
  return idle;
}
