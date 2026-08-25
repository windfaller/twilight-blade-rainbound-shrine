import { CHARACTERS } from "./data/characters";
import { KEEPER_DEF } from "./data/characters";
import { KEEPER_POS, SPAWN, TRIGGERS } from "./data/stages";
import { loadSave, writeSave } from "./systems/save";
import type { Actor, CharacterId, SimState, UiSnapshot } from "./types";

export function makeActorFromKit(id: CharacterId, x: number, y: number, z: number): Actor {
  const kit = CHARACTERS[id];
  return {
    id: "player",
    defId: id,
    kind: "player",
    team: "player",
    name: kit.name,
    pos: { x, y, z },
    prevPos: { x, y, z },
    vel: { x: 0, y: 0, z: 0 },
    yaw: 0,
    prevYaw: 0,
    hp: kit.maxHp,
    maxHp: kit.maxHp,
    spirit: kit.maxSpirit,
    maxSpirit: kit.maxSpirit,
    poise: 80,
    maxPoise: 80,
    shield: 0,
    radius: kit.radius,
    height: kit.height,
    anim: { name: "idle", time: 0, lockedUntil: 0, phase: 0 },
    cd: { dodge: 0, auto: 0, skills: [0, 0, 0] },
    iFramesUntil: 0,
    stunUntil: 0,
    dead: false,
    hidden: false,
    attackSeq: 0,
    comboExpire: 0,
    telegraph: null,
    broken: false,
    phase: 1,
  };
}

export function makeKeeper(): Actor {
  return {
    id: "keeper",
    defId: "keeper",
    kind: "npc",
    team: "neutral",
    name: KEEPER_DEF.name,
    pos: { ...KEEPER_POS },
    prevPos: { ...KEEPER_POS },
    vel: { x: 0, y: 0, z: 0 },
    yaw: Math.PI,
    prevYaw: Math.PI,
    hp: 999,
    maxHp: 999,
    spirit: 0,
    maxSpirit: 0,
    poise: 99,
    maxPoise: 99,
    shield: 0,
    radius: KEEPER_DEF.radius,
    height: KEEPER_DEF.height,
    anim: { name: "idle", time: 0, lockedUntil: 0, phase: 0 },
    cd: { dodge: 0, auto: 0, skills: [0, 0, 0] },
    iFramesUntil: 0,
    stunUntil: 0,
    dead: false,
    hidden: false,
    attackSeq: 0,
    comboExpire: 0,
    broken: false,
    phase: 1,
  };
}

export function createSimState(): SimState {
  const save = loadSave();
  const kit: CharacterId = "rin";
  return {
    time: 0,
    tick: 0,
    screen: "loading",
    overlay: null,
    loading: { progress: 0, label: "點亮山門燈火…", error: null, ready: false },
    selectedKit: kit,
    hoveredKit: kit,
    confirmedKit: false,
    blessing: false,
    relics: [],
    relicChoices: null,
    dialogue: null,
    encounter: null,
    encountersCleared: [],
    gateOpen: false,
    bossPhase: 1,
    arenaBroken: false,
    player: makeActorFromKit(kit, SPAWN.x, SPAWN.y, SPAWN.z),
    actors: [makeKeeper()],
    projectiles: [],
    pulses: [],
    camera: { yawOffset: 0, yawReturn: 0, zoom: 14, shake: 0, lookX: SPAWN.x, lookZ: SPAWN.z },
    path: { waypoints: [], index: 0 },
    combatLog: [],
    vfx: [],
    sfx: [],
    musicCue: "menu",
    hitstop: 0,
    lastStandUsed: false,
    runTime: 0,
    settings: save.settings,
    unlocks: save.unlocks,
    debug: false,
    ended: false,
    killCount: 0,
    pendingRelicFrom: null,
    ultCutIn: 0,
  };
}

export function persist(state: SimState): void {
  writeSave({ settings: state.settings, unlocks: state.unlocks });
}

export function resetRun(state: SimState, kit: CharacterId): void {
  const keep = { settings: state.settings, unlocks: state.unlocks, debug: state.debug };
  const next = createSimState();
  Object.assign(state, next);
  state.settings = keep.settings;
  state.unlocks = keep.unlocks;
  state.debug = keep.debug;
  state.selectedKit = kit;
  state.hoveredKit = kit;
  state.player = makeActorFromKit(kit, SPAWN.x, SPAWN.y, SPAWN.z);
  state.actors = [makeKeeper()];
  state.screen = "explore";
  state.musicCue = "explore";
  state.loading.ready = true;
  state.loading.progress = 1;
}

export function inAabb(x: number, z: number, a: { minX: number; maxX: number; minZ: number; maxZ: number }): boolean {
  return x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ;
}

export function activeTrigger(state: SimState) {
  for (const t of TRIGGERS) {
    if (inAabb(state.player.pos.x, state.player.pos.z, t.aabb)) return t;
  }
  return null;
}

export function toSnapshot(state: SimState): UiSnapshot {
  const kit = CHARACTERS[state.selectedKit];
  const line = state.dialogue ? state.dialogue.lines[state.dialogue.index] : null;
  const boss = state.actors.find((a) => a.defId === "boss" && !a.hidden);
  return {
    screen: state.overlay ?? state.screen,
    overlay: state.overlay,
    loading: state.loading,
    selectedKit: state.selectedKit,
    hoveredKit: state.hoveredKit,
    blessing: state.blessing,
    relics: state.relics,
    relicChoices: state.relicChoices,
    dialogue: line
      ? {
          speaker: line.speaker,
          portrait: line.portrait,
          text: line.text,
          last: state.dialogue!.index >= state.dialogue!.lines.length - 1,
        }
      : null,
    prompt: null,
    player: {
      id: state.selectedKit,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      spirit: state.player.spirit,
      maxSpirit: state.player.maxSpirit,
      shield: state.player.shield,
    },
    skills: kit.skills.map((s, i) => ({
      name: s.name,
      cd: Math.max(0, state.player.cd.skills[i] - state.time),
      max: s.cooldown,
      spirit: s.spirit,
    })),
    encounterName: state.encounter ? labelEncounter(state.encounter.id) : null,
    boss: boss
      ? { name: state.bossPhase >= 2 ? "雨蝕武者 · 殘魄" : "雨蝕武者", hp: boss.hp, maxHp: boss.maxHp, phase: state.bossPhase }
      : null,
    debug: state.debug,
    settings: state.settings,
    unlocks: state.unlocks,
    killCount: state.killCount,
    runTime: state.runTime,
    ultCutIn: state.ultCutIn,
    interactInRange: false,
  };
}

function labelEncounter(id: string): string {
  switch (id) {
    case "enc1":
      return "夜行足輕";
    case "enc2":
      return "符矢混成";
    case "enc3":
      return "青燐與祭師";
    case "elite":
      return "黑金番大將";
    case "boss":
      return "雨蝕武者";
    default:
      return id;
  }
}
