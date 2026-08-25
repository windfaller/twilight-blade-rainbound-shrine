import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, DEFAULT_UNLOCKS, deserializeSave, loadSave, serializeSave } from "../game/systems/save";

describe("save", () => {
  it("defaults to med quality so bloom is off", () => {
    expect(DEFAULT_SETTINGS.quality).toBe("med");
  });

  it("downgrades a stored high-quality save to med", () => {
    const store = new Map<string, string>();
    const ls = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    const prev = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: ls });
    ls.setItem(
      "tb-rainbound-save-v1",
      JSON.stringify({
        settings: { quality: "high", music: 0.7, sfx: 0.85, ambience: 0.55 },
        unlocks: { ...DEFAULT_UNLOCKS },
      }),
    );
    try {
      expect(loadSave().settings.quality).toBe("med");
    } finally {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: prev });
    }
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
