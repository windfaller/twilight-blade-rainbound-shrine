import { describe, expect, it } from "vitest";
import { cooldownMul, critChance, pickRelicChoices, ultMul } from "../game/data/relics";
import { applyRelicPick } from "../game/systems/rewards";
import { createSimState } from "../game/state";

describe("relics", () => {
  it("offers three unseen relics", () => {
    const picks = pickRelicChoices(["aa3-wave"], () => 0.2);
    expect(picks.length).toBe(3);
    expect(picks.some((p) => p.id === "aa3-wave")).toBe(false);
  });

  it("modifiers change combat math", () => {
    expect(cooldownMul(["skill-cdr"])).toBeLessThan(1);
    expect(critChance(["crit-break"])).toBeGreaterThan(critChance([]));
    expect(ultMul(["ult-element"])).toBeGreaterThan(1);
  });

  it("picking a relic stores it and closes overlay", () => {
    const st = createSimState();
    st.relicChoices = pickRelicChoices([], () => 0.1);
    const id = st.relicChoices[0].id;
    applyRelicPick(st, id);
    expect(st.relics).toContain(id);
    expect(st.relicChoices).toBeNull();
    expect(st.screen).toBe("explore");
  });
});
