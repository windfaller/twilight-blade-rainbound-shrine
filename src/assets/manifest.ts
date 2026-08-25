import type { CharacterId } from "../game/types";

export interface AssetEntry {
  id: string;
  url: string;
  group: "core" | "characters" | "enemies" | "env" | "ui";
}

export const ASSET_MANIFEST: AssetEntry[] = [
  { id: "farscape", url: "/assets/env/shrine-farscape.png", group: "env" },
  { id: "tex-stone", url: "/assets/env/wet-stone.png", group: "env" },
  { id: "tex-vermilion", url: "/assets/env/vermilion-wood.png", group: "env" },
  { id: "tex-wood", url: "/assets/env/dark-wood.png", group: "env" },
  { id: "rin-full", url: "/assets/characters/rin-fullbody.png", group: "characters" },
  { id: "rin-port", url: "/assets/characters/rin-portrait.png", group: "characters" },
  { id: "shino-full", url: "/assets/characters/shino-fullbody.png", group: "characters" },
  { id: "shino-port", url: "/assets/characters/shino-portrait.png", group: "characters" },
  { id: "kuzuha-full", url: "/assets/characters/kuzuha-fullbody.png", group: "characters" },
  { id: "kuzuha-port", url: "/assets/characters/kuzuha-portrait.png", group: "characters" },
  { id: "ling-full", url: "/assets/characters/ling-shuang-fullbody.png", group: "characters" },
  { id: "ling-port", url: "/assets/characters/ling-shuang-portrait.png", group: "characters" },
  { id: "elara-full", url: "/assets/characters/elara-fullbody.png", group: "characters" },
  { id: "elara-port", url: "/assets/characters/elara-portrait.png", group: "characters" },
  { id: "vivienne-full", url: "/assets/characters/vivienne-fullbody.png", group: "characters" },
  { id: "vivienne-port", url: "/assets/characters/vivienne-portrait.png", group: "characters" },
  { id: "keeper-full", url: "/assets/characters/lantern-keeper-fullbody.png", group: "characters" },
  { id: "yokai", url: "/assets/enemies/yokai-soldier.png", group: "enemies" },
  { id: "archer", url: "/assets/enemies/ofuda-archer.png", group: "enemies" },
  { id: "hound", url: "/assets/enemies/spirit-hound.png", group: "enemies" },
  { id: "caster", url: "/assets/enemies/ofuda-caster.png", group: "enemies" },
  { id: "elite", url: "/assets/enemies/elite-warrior.png", group: "enemies" },
  { id: "boss1", url: "/assets/enemies/boss-phase1.png", group: "enemies" },
  { id: "boss2", url: "/assets/enemies/boss-phase2.png", group: "enemies" },
];

export const KIT_ART: Record<CharacterId, { full: string; portrait: string }> = {
  rin: { full: "/assets/characters/rin-fullbody.png", portrait: "/assets/characters/rin-portrait.png" },
  shino: { full: "/assets/characters/shino-fullbody.png", portrait: "/assets/characters/shino-portrait.png" },
  kuzuha: { full: "/assets/characters/kuzuha-fullbody.png", portrait: "/assets/characters/kuzuha-portrait.png" },
  ling: { full: "/assets/characters/ling-shuang-fullbody.png", portrait: "/assets/characters/ling-shuang-portrait.png" },
  elara: { full: "/assets/characters/elara-fullbody.png", portrait: "/assets/characters/elara-portrait.png" },
  vivienne: { full: "/assets/characters/vivienne-fullbody.png", portrait: "/assets/characters/vivienne-portrait.png" },
};

export const KEEPER_ART = "/assets/characters/lantern-keeper-fullbody.png";
