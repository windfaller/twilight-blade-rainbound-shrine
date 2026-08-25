import type { RelicDef, RelicId } from "../types";

export const RELICS: Record<RelicId, RelicDef> = {
  "aa3-wave": {
    id: "aa3-wave",
    name: "三段浪刃",
    desc: "第三下普攻激出一輪刀浪。",
    effect: "AA3 額外發射前進波，傷害 70%。",
  },
  "perfect-dodge-clone": {
    id: "perfect-dodge-clone",
    name: "殘影分身",
    desc: "完美閃避留下攻擊分身。",
    effect: "閃避成功時在原處生成 1.4 秒分身斬擊。",
  },
  "foxfire-heal": {
    id: "foxfire-heal",
    name: "狐火回春",
    desc: "命中時有機率以狐火療傷。",
    effect: "每次命中 22% 機率回復 6 生命。",
  },
  "skill-cdr": {
    id: "skill-cdr",
    name: "符鐘加速",
    desc: "技藝冷卻顯著縮短。",
    effect: "技能冷卻 -28%。",
  },
  "last-stand-shield": {
    id: "last-stand-shield",
    name: "殘燈護心",
    desc: "生命低於三成時展開護盾。",
    effect: "首次 HP < 30% 獲得 45 點護盾。",
  },
  "ult-element": {
    id: "ult-element",
    name: "元素終焉",
    desc: "終結技附加屬性崩壞。",
    effect: "大招傷害 +35%，並附加破勢。",
  },
  "crit-break": {
    id: "crit-break",
    name: "要害破勢",
    desc: "暴擊可打斷霸體。",
    effect: "18% 暴擊；暴擊附加大量破勢。",
  },
  "wall-crash": {
    id: "wall-crash",
    name: "壁際猛擊",
    desc: "把敵人撞上障礙會追加傷害。",
    effect: "擊退撞牆時額外 22 傷害並短暫暈眩。",
  },
};

export const RELIC_LIST = Object.values(RELICS);

export function pickRelicChoices(owned: RelicId[], rng: () => number): RelicDef[] {
  const pool = RELIC_LIST.filter((r) => !owned.includes(r.id));
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(3, copy.length));
}

export function cooldownMul(relics: RelicId[]): number {
  return relics.includes("skill-cdr") ? 0.72 : 1;
}

export function critChance(relics: RelicId[]): number {
  return relics.includes("crit-break") ? 0.18 : 0.04;
}

export function ultMul(relics: RelicId[]): number {
  return relics.includes("ult-element") ? 1.35 : 1;
}
