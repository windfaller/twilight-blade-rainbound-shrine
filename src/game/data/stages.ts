import { KEEPER_ART } from "../../assets/manifest";
import type { Circle, InteractionAnchor, Obstacle, TriggerZone, WalkPoly } from "../types";

export const SPAWN = { x: 0, y: 0, z: 7.55 };
export const KEEPER_POS = { x: 4.2, y: 5, z: 34.2 };
export const KEEPER_ANCHOR: InteractionAnchor = {
  id: "keeper-anchor",
  x: 2.15,
  y: 5,
  z: 33.4,
  radius: 2.15,
  targetId: "keeper",
};

export const WALK_POLYS: WalkPoly[] = [
  { id: "spawn", y: 0, points: box(-4.6, 4.6, 5.4, 8.6) },
  { id: "stairs", y: 2.5, points: box(-3.4, 3.4, 8, 25) },
  { id: "torii-yard", y: 5, points: box(-6.5, 6.5, 24, 30) },
  { id: "keeper", y: 5, points: box(-8, 8.5, 29.5, 41) },
  { id: "bridge", y: 5, points: box(-2.6, 2.6, 40.5, 51) },
  { id: "altar", y: 5, points: box(-11, 12, 50.5, 74) },
  { id: "elite", y: 5, points: box(-9, 9, 75, 91) },
  { id: "gate", y: 5, points: box(-4, 4, 90.5, 97) },
  { id: "boss", y: 5, points: box(-11, 11, 96.5, 118) },
];

function box(minX: number, maxX: number, minZ: number, maxZ: number) {
  return [
    { x: minX, z: minZ },
    { x: maxX, z: minZ },
    { x: maxX, z: maxZ },
    { x: minX, z: maxZ },
  ];
}

export const PILLARS: Circle[] = [
  { x: -3.35, z: 16.4, r: 0.5 },
  { x: 3.35, z: 16.4, r: 0.5 },
  { x: -3.6, z: 22.2, r: 0.55 },
  { x: 3.6, z: 22.2, r: 0.55 },
  { x: -3.8, z: 48, r: 0.45 },
  { x: 3.8, z: 48, r: 0.45 },
  { x: -3.6, z: 93.4, r: 0.6 },
  { x: 3.6, z: 93.4, r: 0.6 },
];

export const LANTERN_POINTS: { x: number; z: number; y: number }[] = [
  { x: -3.55, z: 5.15, y: 0 },
  { x: -2.35, z: 7.05, y: 0 },
  { x: 2.45, z: 6.85, y: 0 },
  { x: -2.7, z: 12.2, y: 1.2 },
  { x: 2.7, z: 16.1, y: 2.4 },
  { x: -2.6, z: 21, y: 4 },
  { x: 5.6, z: 32, y: 5 },
  { x: -6.2, z: 36, y: 5 },
  { x: -8.4, z: 56, y: 5 },
  { x: 9.2, z: 58, y: 5 },
  { x: -7.5, z: 66, y: 5 },
  { x: 8.4, z: 70, y: 5 },
  { x: -6.8, z: 80, y: 5 },
  { x: 6.8, z: 84, y: 5 },
  { x: -7.4, z: 104, y: 5 },
  { x: 7.4, z: 108, y: 5 },
];

export const OBSTACLES: Obstacle[] = [
  ...PILLARS.map((p, i) => ({
    id: `pillar-${i}`,
    kind: "pillar" as const,
    x: p.x,
    z: p.z,
    r: p.r,
    height: 5.4,
    fade: true,
  })),
  ...LANTERN_POINTS.map((p, i) => ({
    id: `lantern-${i}`,
    kind: "lantern" as const,
    x: p.x,
    z: p.z,
    r: 0.38,
    height: 1.8,
    fade: true,
  })),
  { id: "bridge-rail-l", kind: "wall", x: -2.7, z: 45.5, r: 0.28, height: 1.1 },
  { id: "bridge-rail-r", kind: "wall", x: 2.7, z: 45.5, r: 0.28, height: 1.1 },
];

export const TRIGGERS: TriggerZone[] = [
  { id: "enc1", kind: "encounter", encounter: "enc1", aabb: { minX: -10, maxX: 11, minZ: 53, maxZ: 60 } },
  { id: "enc2", kind: "encounter", encounter: "enc2", aabb: { minX: -10, maxX: 11, minZ: 60, maxZ: 66 } },
  { id: "enc3", kind: "encounter", encounter: "enc3", aabb: { minX: -10, maxX: 11, minZ: 66, maxZ: 73 } },
  { id: "elite", kind: "encounter", encounter: "elite", aabb: { minX: -8, maxX: 8, minZ: 77, maxZ: 89 } },
  { id: "boss", kind: "encounter", encounter: "boss", aabb: { minX: -10, maxX: 10, minZ: 99, maxZ: 116 } },
];

export const ENCOUNTER_SPAWNS: Record<string, { id: string; x: number; z: number }[]> = {
  enc1: [
    { id: "yokai", x: -3.2, z: 57.5 },
    { id: "yokai", x: 2.6, z: 58.4 },
    { id: "yokai", x: 0.2, z: 55.8 },
    { id: "yokai", x: 4.4, z: 56.6 },
  ],
  enc2: [
    { id: "yokai", x: -2.4, z: 63 },
    { id: "yokai", x: 3.1, z: 62.4 },
    { id: "archer", x: -6.2, z: 65.2 },
    { id: "archer", x: 7.1, z: 64.6 },
  ],
  enc3: [
    { id: "hound", x: -3.6, z: 68.4 },
    { id: "hound", x: 3.8, z: 69.1 },
    { id: "caster", x: 0.4, z: 71.6 },
  ],
  elite: [{ id: "elite", x: 0.2, z: 83.5 }],
  boss: [{ id: "boss", x: 0, z: 108.5 }],
};

export const STAIR_STEPS = 22;

export function groundHeight(_x: number, z: number): number {
  if (z < 8) return 0;
  if (z < 24) {
    const t = (z - 8) / 16;
    const step = Math.floor(t * STAIR_STEPS) / STAIR_STEPS;
    return step * 5;
  }
  return 5;
}

export const TORII_GATES = [
  { x: 0, z: 16.4, y: 2.4, scale: 0.92 },
  { x: 0, z: 22.2, y: 4.2, scale: 1 },
  { x: 0, z: 48, y: 5, scale: 0.92 },
  { x: 0, z: 93.4, y: 5, scale: 1.15 },
];

export const MAP_BOUNDS = { minX: -14, maxX: 14, minZ: -4, maxZ: 120 };

export const KEEPER_DIALOGUE = [
  {
    speaker: "守燈人",
    portrait: KEEPER_ART,
    text: "雨還沒停。山門的燈仍為旅人留著——你是來解封雨鎖的嗎？",
  },
  {
    speaker: "守燈人",
    portrait: KEEPER_ART,
    text: "收下這盞守燈祝福吧。怨靈會在森林祭壇一波波醒來，別以為斬倒第一個就能走。",
  },
  {
    speaker: "守燈人",
    portrait: KEEPER_ART,
    text: "每場勝仗後，山會贈你遺物。選對了，下一場的刀勢就會改寫。",
  },
  {
    speaker: "守燈人",
    portrait: KEEPER_ART,
    text: "斷橋之後是祭壇、番大將，再往深處便是雨蝕武者。願殘月護刃。",
  },
];
