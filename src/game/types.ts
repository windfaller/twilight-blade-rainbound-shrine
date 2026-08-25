export type Quality = "high" | "med" | "low";
export type ScreenId =
  | "loading"
  | "menu"
  | "controls"
  | "select"
  | "explore"
  | "dialogue"
  | "combat"
  | "relic"
  | "pause"
  | "settings"
  | "victory"
  | "defeat"
  | "unlocks";

export type CharacterId = "rin" | "shino" | "kuzuha" | "ling" | "elara" | "vivienne";
export type EnemyId =
  | "yokai"
  | "archer"
  | "hound"
  | "caster"
  | "elite"
  | "boss";
export type EncounterId = "enc1" | "enc2" | "enc3" | "elite" | "boss";
export type RelicId =
  | "aa3-wave"
  | "perfect-dodge-clone"
  | "foxfire-heal"
  | "skill-cdr"
  | "last-stand-shield"
  | "ult-element"
  | "crit-break"
  | "wall-crash";

export type AnimName =
  | "idle"
  | "walk"
  | "run"
  | "turn"
  | "aa1"
  | "aa2"
  | "aa3"
  | "skill1"
  | "skill2"
  | "dodge"
  | "hit"
  | "knockdown"
  | "defeat"
  | "victory"
  | "ult";

export type Team = "player" | "enemy" | "neutral";
export type DamageKind = "physical" | "spirit" | "fire" | "holy" | "blood" | "moon";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Circle {
  x: number;
  z: number;
  r: number;
}

export interface Aabb {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WalkPoly {
  id: string;
  points: { x: number; z: number }[];
  y: number;
}

export interface Obstacle {
  id: string;
  kind: "pillar" | "lantern" | "wall" | "prop";
  x: number;
  z: number;
  r: number;
  height: number;
  fade?: boolean;
}

export interface InteractionAnchor {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  targetId: string;
}

export interface TriggerZone {
  id: string;
  aabb: Aabb;
  kind: "encounter" | "gate" | "story";
  encounter?: EncounterId;
}

export interface SkillDef {
  id: string;
  name: string;
  key: "Q" | "R" | "F";
  slot: 0 | 1 | 2;
  desc: string;
  cooldown: number;
  spirit: number;
  startup: number;
  active: number;
  recover: number;
  range: number;
  radius: number;
  damage: number;
  kind: DamageKind;
  tags: string[];
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  nameEn: string;
  origin: string;
  weapon: string;
  role: string;
  difficulty: "入門" | "標準" | "進階";
  blurb: string;
  color: string;
  accent: string;
  maxHp: number;
  maxSpirit: number;
  moveSpeed: number;
  runSpeed: number;
  dodgeSpeed: number;
  dodgeTime: number;
  radius: number;
  height: number;
  autoRange: number;
  autos: [number, number, number];
  autoKind: DamageKind;
  skills: [SkillDef, SkillDef, SkillDef];
  artFull: string;
  artPortrait: string;
}

export interface EnemyDef {
  id: EnemyId;
  name: string;
  maxHp: number;
  maxPoise: number;
  damage: number;
  moveSpeed: number;
  radius: number;
  height: number;
  range: number;
  startup: number;
  active: number;
  recover: number;
  hyperarmor?: boolean;
  art: string;
  artAlt?: string;
  kind: DamageKind;
}

export interface RelicDef {
  id: RelicId;
  name: string;
  desc: string;
  effect: string;
}

export interface AnimState {
  name: AnimName;
  time: number;
  lockedUntil: number;
  phase: number;
}

export interface CooldownMap {
  dodge: number;
  auto: number;
  skills: [number, number, number];
}

export interface Actor {
  id: string;
  defId: string;
  kind: "player" | "npc" | "enemy";
  team: Team;
  name: string;
  pos: Vec3;
  prevPos: Vec3;
  vel: Vec3;
  yaw: number;
  prevYaw: number;
  hp: number;
  maxHp: number;
  spirit: number;
  maxSpirit: number;
  poise: number;
  maxPoise: number;
  shield: number;
  radius: number;
  height: number;
  anim: AnimState;
  cd: CooldownMap;
  iFramesUntil: number;
  stunUntil: number;
  dead: boolean;
  hidden: boolean;
  attackSeq: number;
  comboExpire: number;
  telegraph?: Telegraph | null;
  ai?: AiState;
  broken: boolean;
  phase: number;
  pendingFire?: number;
}

export interface Telegraph {
  kind: "cone" | "line" | "circle" | "ring";
  x: number;
  z: number;
  yaw: number;
  length: number;
  width: number;
  until: number;
  danger: number;
}

export interface AiState {
  targetId: string | null;
  nextThink: number;
  nextAttack: number;
  mode: "idle" | "chase" | "windup" | "attack" | "reposition" | "cast" | "charge";
  chargeUntil: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  team: Team;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  radius: number;
  damage: number;
  kind: DamageKind;
  homing?: string;
  style: "bolt" | "kunai" | "foxfire" | "qi" | "wave" | "star" | "ofuda";
  pierce: number;
}

export interface HitboxPulse {
  ownerId: string;
  team: Team;
  x: number;
  z: number;
  radius: number;
  damage: number;
  kind: DamageKind;
  knock: number;
  poise: number;
  tags: string[];
  until: number;
  hitIds: string[];
}

export interface CombatEvent {
  t: number;
  kind: "hit" | "kill" | "break" | "heal" | "phase";
  src: string;
  dst: string;
  amount: number;
}

export interface VfxEvent {
  id: string;
  kind:
    | "slash"
    | "impact"
    | "spark"
    | "heal"
    | "burst"
    | "rainburst"
    | "clone"
    | "ward"
    | "ult"
    | "telegraph"
    | "numbers";
  x: number;
  y: number;
  z: number;
  color: string;
  life: number;
  scale: number;
  text?: string;
}

export interface DialogueLine {
  speaker: string;
  portrait: string;
  text: string;
}

export interface EncounterState {
  id: EncounterId;
  alive: number;
  startedAt: number;
  cleared: boolean;
}

export interface CameraSim {
  yawOffset: number;
  yawReturn: number;
  zoom: number;
  shake: number;
  lookX: number;
  lookZ: number;
}

export interface InputFrame {
  moveX: number;
  moveZ: number;
  attack: boolean;
  dodge: boolean;
  skills: [boolean, boolean, boolean];
  interact: boolean;
  pointerWorld: { x: number; z: number } | null;
  clickPath: boolean;
  clickInteractId: string | null;
  pause: boolean;
  rotate: number;
  zoomDelta: number;
}

export type UiCommand =
  | { type: "toMenu" }
  | { type: "toControls" }
  | { type: "toSelect" }
  | { type: "toSettings" }
  | { type: "toUnlocks" }
  | { type: "selectKit"; id: CharacterId }
  | { type: "hoverKit"; id: CharacterId | null }
  | { type: "confirmKit" }
  | { type: "advanceDialogue" }
  | { type: "pickRelic"; id: RelicId }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "retry" }
  | { type: "nextRun" }
  | { type: "setQuality"; quality: Quality }
  | { type: "setVolume"; bus: "music" | "sfx" | "ambience"; value: number }
  | { type: "retryLoad" }
  | { type: "toggleDebug" };

export interface SettingsState {
  quality: Quality;
  music: number;
  sfx: number;
  ambience: number;
}

export interface UnlocksState {
  clearedKits: CharacterId[];
  seenEnding: boolean;
  relicsSeen: RelicId[];
  bestTime: number;
}

export interface LoadingState {
  progress: number;
  label: string;
  error: string | null;
  ready: boolean;
}

export interface PathState {
  waypoints: { x: number; z: number }[];
  index: number;
}

export interface SimState {
  time: number;
  tick: number;
  screen: ScreenId;
  overlay: ScreenId | null;
  loading: LoadingState;
  selectedKit: CharacterId;
  hoveredKit: CharacterId | null;
  confirmedKit: boolean;
  blessing: boolean;
  relics: RelicId[];
  relicChoices: RelicDef[] | null;
  dialogue: { lines: DialogueLine[]; index: number } | null;
  encounter: EncounterState | null;
  encountersCleared: EncounterId[];
  gateOpen: boolean;
  bossPhase: number;
  arenaBroken: boolean;
  player: Actor;
  actors: Actor[];
  projectiles: Projectile[];
  pulses: HitboxPulse[];
  camera: CameraSim;
  path: PathState;
  combatLog: CombatEvent[];
  vfx: VfxEvent[];
  sfx: string[];
  musicCue: string;
  hitstop: number;
  lastStandUsed: boolean;
  runTime: number;
  settings: SettingsState;
  unlocks: UnlocksState;
  debug: boolean;
  ended: boolean;
  killCount: number;
  pendingRelicFrom: EncounterId | null;
  ultCutIn: number;
}

export interface UiSnapshot {
  screen: ScreenId;
  overlay: ScreenId | null;
  loading: LoadingState;
  selectedKit: CharacterId;
  hoveredKit: CharacterId | null;
  blessing: boolean;
  relics: RelicId[];
  relicChoices: RelicDef[] | null;
  dialogue: { speaker: string; portrait: string; text: string; last: boolean } | null;
  prompt: { text: string; x: number; z: number } | null;
  player: {
    id: CharacterId;
    hp: number;
    maxHp: number;
    spirit: number;
    maxSpirit: number;
    shield: number;
  };
  skills: { name: string; cd: number; max: number; spirit: number }[];
  encounterName: string | null;
  boss: { name: string; hp: number; maxHp: number; phase: number } | null;
  debug: boolean;
  settings: SettingsState;
  unlocks: UnlocksState;
  killCount: number;
  runTime: number;
  ultCutIn: number;
  interactInRange: boolean;
  objective: string;
}
