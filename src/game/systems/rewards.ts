import { ENCOUNTER_SPAWNS } from "../data/stages";
import { pickRelicChoices } from "../data/relics";
import type { EncounterId, RelicId, SimState } from "../types";
import { livingEnemies, makeEnemyActor } from "./combat";

export function spawnEncounter(state: SimState, id: EncounterId): void {
  if (state.encountersCleared.includes(id) || state.encounter) return;
  const list = ENCOUNTER_SPAWNS[id] ?? [];
  for (const s of list) {
    state.actors.push(makeEnemyActor(s.id as "yokai", s.x, s.z, state.time));
  }
  state.encounter = { id, alive: list.length, startedAt: state.time, cleared: false };
  state.screen = "combat";
  state.musicCue = id === "boss" ? "boss1" : id === "elite" ? "elite" : "combat";
  state.sfx.push("encounter");
}

export function checkEncounterClear(state: SimState): void {
  if (!state.encounter || state.encounter.cleared) return;
  const live = livingEnemies(state);
  state.encounter.alive = live.length;
  if (live.length > 0) return;
  state.encounter.cleared = true;
  const id = state.encounter.id;
  if (!state.encountersCleared.includes(id)) state.encountersCleared.push(id);
  partialRecover(state);
  if (id === "boss") {
    state.screen = "victory";
    state.overlay = "victory";
    state.ended = true;
    state.player.anim.name = "victory";
    state.musicCue = "victory";
    if (!state.unlocks.clearedKits.includes(state.selectedKit)) {
      state.unlocks.clearedKits.push(state.selectedKit);
    }
    state.unlocks.seenEnding = true;
    if (!state.unlocks.bestTime || state.runTime < state.unlocks.bestTime) {
      state.unlocks.bestTime = state.runTime;
    }
    return;
  }
  if (id === "elite") {
    state.gateOpen = true;
    state.sfx.push("gate");
  }
  const choices = pickRelicChoices(state.relics, Math.random);
  if (choices.length) {
    state.relicChoices = choices;
    state.pendingRelicFrom = id;
    state.overlay = "relic";
    state.screen = "relic";
  } else {
    state.encounter = null;
    state.screen = "explore";
    state.musicCue = "explore";
  }
}

export function applyRelicPick(state: SimState, id: RelicId): void {
  if (!state.relicChoices?.some((r) => r.id === id)) return;
  if (!state.relics.includes(id)) state.relics.push(id);
  if (!state.unlocks.relicsSeen.includes(id)) state.unlocks.relicsSeen.push(id);
  state.relicChoices = null;
  state.pendingRelicFrom = null;
  state.overlay = null;
  state.encounter = null;
  state.screen = "explore";
  state.musicCue = "explore";
  state.sfx.push("relic");
}

export function partialRecover(state: SimState): void {
  const p = state.player;
  const missing = p.maxHp - p.hp;
  p.hp = Math.min(p.maxHp, p.hp + missing * 0.35 + 8);
  p.spirit = Math.min(p.maxSpirit, p.spirit + p.maxSpirit * 0.5);
}

export function nextEncounterReady(state: SimState, id: EncounterId): boolean {
  if (!state.blessing) return false;
  if (state.encountersCleared.includes(id)) return false;
  if (state.encounter) return false;
  if (id === "enc2") return state.encountersCleared.includes("enc1");
  if (id === "enc3") return state.encountersCleared.includes("enc2");
  if (id === "elite") return state.encountersCleared.includes("enc3");
  if (id === "boss") return state.encountersCleared.includes("elite") && state.gateOpen;
  return id === "enc1";
}
