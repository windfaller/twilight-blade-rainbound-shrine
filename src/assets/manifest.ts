import type { CharacterId } from "../game/types";

export function assetUrl(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${p}`;
}

export interface AssetEntry {
  id: string;
  url: string;
  group: "core" | "characters" | "enemies" | "env" | "ui";
}

export const ASSET_MANIFEST: AssetEntry[] = [
  { id: "farscape", url: assetUrl("/assets/env/shrine-farscape.png"), group: "env" },
  { id: "tex-stone", url: assetUrl("/assets/env/wet-stone.png"), group: "env" },
  { id: "tex-vermilion", url: assetUrl("/assets/env/vermilion-wood.png"), group: "env" },
  { id: "tex-wood", url: assetUrl("/assets/env/dark-wood.png"), group: "env" },
  { id: "rin-full", url: assetUrl("/assets/characters/rin-fullbody.png"), group: "characters" },
  { id: "rin-port", url: assetUrl("/assets/characters/rin-portrait.png"), group: "characters" },
  { id: "shino-full", url: assetUrl("/assets/characters/shino-fullbody.png"), group: "characters" },
  { id: "shino-port", url: assetUrl("/assets/characters/shino-portrait.png"), group: "characters" },
  { id: "kuzuha-full", url: assetUrl("/assets/characters/kuzuha-fullbody.png"), group: "characters" },
  { id: "kuzuha-port", url: assetUrl("/assets/characters/kuzuha-portrait.png"), group: "characters" },
  { id: "ling-full", url: assetUrl("/assets/characters/ling-shuang-fullbody.png"), group: "characters" },
  { id: "ling-port", url: assetUrl("/assets/characters/ling-shuang-portrait.png"), group: "characters" },
  { id: "elara-full", url: assetUrl("/assets/characters/elara-fullbody.png"), group: "characters" },
  { id: "elara-port", url: assetUrl("/assets/characters/elara-portrait.png"), group: "characters" },
  { id: "vivienne-full", url: assetUrl("/assets/characters/vivienne-fullbody.png"), group: "characters" },
  { id: "vivienne-port", url: assetUrl("/assets/characters/vivienne-portrait.png"), group: "characters" },
  { id: "keeper-full", url: assetUrl("/assets/characters/lantern-keeper-fullbody.png"), group: "characters" },
  { id: "yokai", url: assetUrl("/assets/enemies/yokai-soldier.png"), group: "enemies" },
  { id: "archer", url: assetUrl("/assets/enemies/ofuda-archer.png"), group: "enemies" },
  { id: "hound", url: assetUrl("/assets/enemies/spirit-hound.png"), group: "enemies" },
  { id: "caster", url: assetUrl("/assets/enemies/ofuda-caster.png"), group: "enemies" },
  { id: "elite", url: assetUrl("/assets/enemies/elite-warrior.png"), group: "enemies" },
  { id: "boss1", url: assetUrl("/assets/enemies/boss-phase1.png"), group: "enemies" },
  { id: "boss2", url: assetUrl("/assets/enemies/boss-phase2.png"), group: "enemies" },
];

export const KIT_ART: Record<CharacterId, { full: string; portrait: string }> = {
  rin: { full: assetUrl("/assets/characters/rin-fullbody.png"), portrait: assetUrl("/assets/characters/rin-portrait.png") },
  shino: { full: assetUrl("/assets/characters/shino-fullbody.png"), portrait: assetUrl("/assets/characters/shino-portrait.png") },
  kuzuha: { full: assetUrl("/assets/characters/kuzuha-fullbody.png"), portrait: assetUrl("/assets/characters/kuzuha-portrait.png") },
  ling: { full: assetUrl("/assets/characters/ling-shuang-fullbody.png"), portrait: assetUrl("/assets/characters/ling-shuang-portrait.png") },
  elara: { full: assetUrl("/assets/characters/elara-fullbody.png"), portrait: assetUrl("/assets/characters/elara-portrait.png") },
  vivienne: { full: assetUrl("/assets/characters/vivienne-fullbody.png"), portrait: assetUrl("/assets/characters/vivienne-portrait.png") },
};

export const KEEPER_ART = assetUrl("/assets/characters/lantern-keeper-fullbody.png");
