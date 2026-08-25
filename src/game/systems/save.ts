import type { SettingsState, UnlocksState } from "../types";

const KEY = "tb-rainbound-save-v1";

export interface SaveBlob {
  settings: SettingsState;
  unlocks: UnlocksState;
}

export const DEFAULT_SETTINGS: SettingsState = {
  quality: "med",
  music: 0.7,
  sfx: 0.85,
  ambience: 0.55,
};

export const DEFAULT_UNLOCKS: UnlocksState = {
  clearedKits: [],
  seenEnding: false,
  relicsSeen: [],
  bestTime: 0,
};

export function coerceSettings(partial?: Partial<SettingsState>): SettingsState {
  const settings = { ...DEFAULT_SETTINGS, ...partial };
  /* Production hotfix: old default was high bloom, which blacks the world on some GPUs. */
  if (settings.quality === "high") settings.quality = "med";
  return settings;
}

export function loadSave(): SaveBlob {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return { settings: coerceSettings(), unlocks: { ...DEFAULT_UNLOCKS, clearedKits: [], relicsSeen: [] } };
    const parsed = JSON.parse(raw) as SaveBlob;
    return {
      settings: coerceSettings(parsed.settings),
      unlocks: {
        ...DEFAULT_UNLOCKS,
        ...parsed.unlocks,
        clearedKits: parsed.unlocks?.clearedKits ?? [],
        relicsSeen: parsed.unlocks?.relicsSeen ?? [],
      },
    };
  } catch {
    return { settings: coerceSettings(), unlocks: { ...DEFAULT_UNLOCKS, clearedKits: [], relicsSeen: [] } };
  }
}

export function writeSave(blob: SaveBlob): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(blob));
  } catch {
    /* ignore quota */
  }
}

export function serializeSave(blob: SaveBlob): string {
  return JSON.stringify(blob);
}

export function deserializeSave(raw: string): SaveBlob {
  const parsed = JSON.parse(raw) as SaveBlob;
  if (!parsed.settings || !parsed.unlocks) throw new Error("invalid save");
  return parsed;
}
