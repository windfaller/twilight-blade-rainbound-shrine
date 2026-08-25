import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, DEFAULT_UNLOCKS, coerceSettings, deserializeSave, serializeSave } from "../game/systems/save";

describe("save", () => {
  it("defaults to med quality so bloom is off", () => {
    expect(DEFAULT_SETTINGS.quality).toBe("med");
    expect(coerceSettings().quality).toBe("med");
  });

  it("downgrades a stored high-quality save to med", () => {
    expect(coerceSettings({ quality: "high", music: 0.7, sfx: 0.85, ambience: 0.55 }).quality).toBe("med");
    expect(coerceSettings({ quality: "low" }).quality).toBe("low");
  });

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
