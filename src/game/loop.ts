import { CHARACTERS } from "./data/characters";
import { KEEPER_ANCHOR } from "./data/stages";
import { spawnDodgeClone, stepEnemyAi, stepProjectiles, stepPulses, tryPlayerAttack, resolveEnemyAttacks, tickRegen } from "./systems/combat";
import { applyMovement, setClickPath, startDodge } from "./systems/movement";
import { bakeNav, findPath, nearestAnchor, nearestWalkable, type NavGrid } from "./systems/navigation";
import { advanceDialogue, beginKeeperTalk, clickedKeeper, interactionPrompt, keeperInRange } from "./systems/interaction";
import { applyRelicPick, checkEncounterClear, nextEncounterReady, spawnEncounter } from "./systems/rewards";
import { activeTrigger, createSimState, persist, resetRun, toSnapshot } from "./state";
import type { CharacterId, InputFrame, RelicId, ScreenId, SimState, UiCommand, UiSnapshot } from "./types";

const DT = 1 / 60;

export class Game {
  state: SimState = createSimState();
  nav: NavGrid = bakeNav(false, false);
  private navGate = false;
  private navBroken = false;
  private pendingKeeperTalk = false;
  private acc = 0;
  private cmds: UiCommand[] = [];
  private listeners = new Set<() => void>();

  enqueue(cmd: UiCommand): void {
    this.cmds.push(cmd);
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(): void {
    for (const l of this.listeners) l();
  }

  snapshot(): UiSnapshot {
    const snap = toSnapshot(this.state);
    const prompt = interactionPrompt(this.state);
    snap.prompt = prompt;
    snap.interactInRange = keeperInRange(this.state);
    return snap;
  }

  setLoading(progress: number, label: string, error: string | null = null): void {
    this.state.loading.progress = progress;
    this.state.loading.label = label;
    this.state.loading.error = error;
    if (progress >= 1 && !error) {
      this.state.loading.ready = true;
      if (this.state.screen === "loading") this.state.screen = "menu";
      this.state.musicCue = "menu";
    }
    this.notify();
  }

  tick(frameDt: number, input: InputFrame): void {
    this.flushCommands();
    const st = this.state;
    if (st.screen === "loading") return;
    const blocking: ScreenId[] = ["menu", "controls", "select", "settings", "unlocks", "victory", "defeat", "relic"];
    if (blocking.includes(st.overlay ?? st.screen) && st.screen !== "explore" && st.screen !== "combat") {
      if (st.overlay === "dialogue") {
        if (input.interact) advanceDialogue(st);
      }
      this.notify();
      return;
    }
    if (st.overlay === "dialogue") {
      if (input.interact) advanceDialogue(st);
      this.notify();
      return;
    }
    if (st.overlay === "pause" || st.overlay === "settings") {
      if (input.pause) {
        st.overlay = null;
      }
      this.notify();
      return;
    }
    if (input.pause && (st.screen === "explore" || st.screen === "combat")) {
      st.overlay = "pause";
      this.notify();
      return;
    }

    this.acc += Math.min(frameDt, 0.08);
    let steps = 0;
    while (this.acc >= DT && steps < 5) {
      this.acc -= DT;
      steps += 1;
      this.step(DT, input);
      input = { ...input, attack: false, dodge: false, skills: [false, false, false], interact: false, clickPath: false, clickInteractId: null, pause: false };
    }
    this.notify();
  }

  private step(dt: number, input: InputFrame): void {
    const st = this.state;
    if (st.hitstop > 0) {
      st.hitstop -= dt;
      checkEncounterClear(st);
      return;
    }
    st.time += dt;
    st.tick += 1;
    if (st.screen === "explore" || st.screen === "combat") st.runTime += dt;

    st.camera.zoom = Math.max(8, Math.min(26, st.camera.zoom + input.zoomDelta));
    st.camera.yawOffset += input.rotate;
    st.camera.yawOffset = Math.max(-0.24, Math.min(0.24, st.camera.yawOffset));
    if (Math.abs(input.rotate) < 1e-4) {
      st.camera.yawOffset *= 0.9;
      if (Math.abs(st.camera.yawOffset) < 0.002) st.camera.yawOffset = 0;
    }
    st.camera.shake *= 0.86;
    st.camera.lookX += (st.player.pos.x - st.camera.lookX) * 0.12;
    st.camera.lookZ += (st.player.pos.z - st.camera.lookZ) * 0.12;

    if (input.clickInteractId === "keeper" || (input.pointerWorld && clickedKeeper(input.pointerWorld.x, input.pointerWorld.z))) {
      const a = nearestAnchor(st.player.pos.x, st.player.pos.z, [KEEPER_ANCHOR]);
      const path = findPath(this.nav, st.player.pos.x, st.player.pos.z, a.x, a.z);
      setClickPath(st.path, path.length ? path : [{ x: a.x, z: a.z }]);
      this.pendingKeeperTalk = true;
    } else if (input.clickPath && input.pointerWorld) {
      const t = nearestWalkable(this.nav, input.pointerWorld.x, input.pointerWorld.z);
      const path = findPath(this.nav, st.player.pos.x, st.player.pos.z, t.x, t.z);
      setClickPath(st.path, path);
    }

    if (input.interact || (this.pendingKeeperTalk && keeperInRange(st))) {
      if (keeperInRange(st)) {
        beginKeeperTalk(st);
        this.pendingKeeperTalk = false;
      }
    }

    if (input.dodge) {
      const ok = startDodge(st, input);
      if (ok) spawnDodgeClone(st);
    }

    applyMovement(st, input, dt);
    tryPlayerAttack(st, input);
    stepEnemyAi(st, dt);
    resolveEnemyAttacks(st);
    stepProjectiles(st, dt);
    stepPulses(st);
    tickRegen(st, dt);

    st.vfx = st.vfx.filter((v) => {
      v.life -= dt;
      return v.life > 0;
    });

    const trig = activeTrigger(st);
    if (trig?.encounter && nextEncounterReady(st, trig.encounter)) {
      spawnEncounter(st, trig.encounter);
      this.rebuildNav();
    }
    checkEncounterClear(st);
    if (st.gateOpen !== this.navGate || st.arenaBroken !== this.navBroken) this.rebuildNav();

    if (st.player.dead && !st.ended) {
      st.ended = true;
      st.screen = "defeat";
      st.overlay = "defeat";
      st.musicCue = "defeat";
    }
    if (st.sfx.length > 24) st.sfx.splice(0, st.sfx.length - 12);
  }

  rebuildNav(): void {
    this.navGate = this.state.gateOpen;
    this.navBroken = this.state.arenaBroken;
    this.nav = bakeNav(this.navGate, this.navBroken);
  }

  private flushCommands(): void {
    const st = this.state;
    for (const c of this.cmds) {
      switch (c.type) {
        case "toMenu":
          st.overlay = null;
          st.screen = "menu";
          st.musicCue = "menu";
          break;
        case "toControls":
          st.screen = "controls";
          break;
        case "toSelect":
          st.screen = "select";
          st.hoveredKit = st.selectedKit;
          break;
        case "toSettings":
          st.overlay = st.screen === "menu" ? null : "settings";
          if (st.screen === "menu") st.screen = "settings";
          break;
        case "toUnlocks":
          st.screen = "unlocks";
          break;
        case "selectKit":
          st.selectedKit = c.id;
          st.hoveredKit = c.id;
          break;
        case "hoverKit":
          st.hoveredKit = c.id;
          break;
        case "confirmKit":
          resetRun(st, st.selectedKit);
          this.rebuildNav();
          break;
        case "advanceDialogue":
          advanceDialogue(st);
          break;
        case "pickRelic":
          applyRelicPick(st, c.id as RelicId);
          persist(st);
          break;
        case "pause":
          st.overlay = "pause";
          break;
        case "resume":
          st.overlay = null;
          break;
        case "retry":
          resetRun(st, st.selectedKit);
          this.rebuildNav();
          break;
        case "nextRun":
          st.screen = "select";
          st.overlay = null;
          st.ended = false;
          break;
        case "setQuality":
          st.settings.quality = c.quality;
          persist(st);
          break;
        case "setVolume":
          st.settings[c.bus] = c.value;
          persist(st);
          break;
        case "retryLoad":
          st.loading.error = null;
          st.loading.progress = 0;
          st.loading.ready = false;
          st.screen = "loading";
          break;
        case "toggleDebug":
          st.debug = !st.debug;
          break;
      }
    }
    this.cmds.length = 0;
  }
}

export const FIXED_DT = DT;
export const KIT_IDS = Object.keys(CHARACTERS) as CharacterId[];
