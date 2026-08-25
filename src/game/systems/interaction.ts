import { KEEPER_ANCHOR, KEEPER_DIALOGUE, KEEPER_POS } from "../data/stages";
import { dist2 } from "../math";
import type { SimState } from "../types";

export function keeperInRange(state: SimState): boolean {
  const p = state.player;
  return dist2(p.pos.x, p.pos.z, KEEPER_ANCHOR.x, KEEPER_ANCHOR.z) <= KEEPER_ANCHOR.radius + 0.15;
}

export function clickedKeeper(wx: number, wz: number): boolean {
  return dist2(wx, wz, KEEPER_POS.x, KEEPER_POS.z) < 1.6;
}

export function beginKeeperTalk(state: SimState): void {
  if (state.blessing && !state.dialogue) {
    state.dialogue = {
      lines: [
        {
          speaker: "守燈人",
          portrait: KEEPER_DIALOGUE[0].portrait,
          text: "燈還亮著。往祭壇去吧——遺物會改寫你的下一場刀勢。",
        },
      ],
      index: 0,
    };
    state.overlay = "dialogue";
    return;
  }
  state.dialogue = { lines: KEEPER_DIALOGUE, index: 0 };
  state.overlay = "dialogue";
  state.sfx.push("talk");
}

export function advanceDialogue(state: SimState): void {
  if (!state.dialogue) return;
  if (state.dialogue.index < state.dialogue.lines.length - 1) {
    state.dialogue.index += 1;
    state.sfx.push("ui");
    return;
  }
  finishDialogue(state);
}

export function finishDialogue(state: SimState): void {
  if (!state.blessing) {
    state.blessing = true;
    state.player.shield += 20;
    state.player.spirit = state.player.maxSpirit;
    state.sfx.push("bless");
  }
  state.dialogue = null;
  if (state.overlay === "dialogue") state.overlay = null;
}

export function interactionPrompt(state: SimState): { text: string; x: number; z: number } | null {
  if (state.overlay) return null;
  if (keeperInRange(state) && !state.encounter) {
    return { text: "交談　守燈人", x: KEEPER_ANCHOR.x, z: KEEPER_ANCHOR.z };
  }
  return null;
}
