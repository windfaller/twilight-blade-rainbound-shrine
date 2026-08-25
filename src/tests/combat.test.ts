import { describe, expect, it } from "vitest";
import { CHARACTERS } from "../game/data/characters";
import { applyDamage, makeEnemyActor, resetCombatIds } from "../game/systems/combat";
import { createSimState } from "../game/state";

describe("combat", () => {
  it("applies damage, hit log and kill", () => {
    resetCombatIds();
    const st = createSimState();
    const foe = makeEnemyActor("yokai", 1, 1, 0);
    foe.hp = 10;
    st.actors.push(foe);
    const dealt = applyDamage(st, st.player, foe, 12, "physical", 0.2, ["aa"]);
    expect(dealt).toBeGreaterThan(0);
    expect(st.combatLog.some((e) => e.kind === "hit")).toBe(true);
    expect(foe.dead || foe.hp < 10).toBe(true);
  });

  it("ult relic multiplies tagged ult damage", () => {
    resetCombatIds();
    const roll = Math.random;
    Math.random = () => 0.99;
    try {
      const st = createSimState();
      st.relics = ["ult-element"];
      const a = makeEnemyActor("yokai", 0, 2, 0);
      const b = makeEnemyActor("yokai", 2, 2, 0);
      a.maxHp = b.maxHp = 400;
      a.hp = b.hp = 400;
      applyDamage(st, st.player, a, 40, "moon", 0, ["ult"]);
      st.relics = [];
      applyDamage(st, st.player, b, 40, "moon", 0, ["ult"]);
      expect(400 - a.hp).toBeGreaterThan(400 - b.hp);
    } finally {
      Math.random = roll;
    }
  });

  it("six kits have distinct skill ids", () => {
    const ids = Object.values(CHARACTERS).flatMap((c) => c.skills.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
