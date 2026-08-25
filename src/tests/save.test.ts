import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, DEFAULT_UNLOCKS, deserializeSave, serializeSave } from "../game/systems/save";

describe("save", () => {
  it("roundtrips settings and unlocks", () => {
    const blob = {
      settings: { ...DEFAULT_SETTINGS, quality: "low" as const, music: 0.2 },
      unlocks: { ...DEFAULT_UNLOCKS, seenEnding: true, clearedKits: ["rin" as const], relicsSeen: ["aa3-wave" as const], bestTime: 320 },
    };
    const raw = serializeSave(blob);
    const back = deserializeSave(raw);
    expect(back.settings.quality).toBe("low");
    expect(back.unlocks.clearedKits).toContain("rin");
    expect(back.unlocks.bestTime).toBe(320);
  });

  it("rejects incomplete payload", () => {
    expect(() => deserializeSave("{}")).toThrow();
  });
});
