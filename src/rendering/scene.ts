import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { CHARACTERS } from "../game/data/characters";
import { KEEPER_DEF } from "../game/data/characters";
import { ENEMIES } from "../game/data/enemies";
import type { Game } from "../game/loop";
import { lerp, lerpAngle } from "../game/math";
import type { Actor, CharacterId, EnemyId, Quality } from "../game/types";
import { makeCharacterView, syncCharacterView, swapTexture, type CharacterView } from "./characters";
import { cameraYaw, createGameCamera, syncCamera } from "./camera";
import { buildEnvironment, stepAtmosphere, type EnvHandles } from "./environment";
import { applyQuality, createLighting } from "./lighting";
import { VfxWorld } from "./vfx";

export class WorldRenderer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = createGameCamera();
  composer: EffectComposer | null = null;
  views = new Map<string, CharacterView>();
  env: EnvHandles | null = null;
  vfx = new VfxWorld();
  textures = new Map<string, THREE.Texture>();
  private seenVfx = new Set<string>();
  private fadeMats: THREE.Mesh[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.scene.background = new THREE.Color(0x070a10);
    this.scene.add(this.vfx.root);
  }

  async loadTextures(entries: { id: string; url: string }[], onProg: (n: number, label: string) => void): Promise<void> {
    const loader = new THREE.TextureLoader();
    let done = 0;
    for (const e of entries) {
      const tex = await new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          e.url,
          (t) => resolve(t),
          undefined,
          () => reject(new Error(`404 ${e.url}`)),
        );
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(e.id, tex);
      done += 1;
      onProg(done / entries.length, e.id);
    }
  }

  build(quality: Quality): void {
    const tex: Record<string, THREE.Texture> = {};
    for (const [k, v] of this.textures) tex[k] = v;
    const lights = createLighting(this.scene, quality);
    this.env = buildEnvironment(this.scene, tex, lights, quality);
    applyQuality(this.renderer, quality);
    this.setupComposer(quality);
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.castShadow) this.fadeMats.push(o);
    });
  }

  private setupComposer(quality: Quality): void {
    if (quality === "low") {
      this.composer = null;
      return;
    }
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), quality === "high" ? 0.46 : 0.28, 0.55, 0.72);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    this.composer = composer;
  }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  ensureActor(actor: Actor): CharacterView {
    let v = this.views.get(actor.id);
    if (v) return v;
    const tex = this.textureFor(actor);
    v = makeCharacterView(actor.id, tex, actor.height);
    this.views.set(actor.id, v);
    this.scene.add(v.root);
    return v;
  }

  textureFor(actor: Actor): THREE.Texture {
    if (actor.kind === "player") {
      const kit = CHARACTERS[actor.defId as CharacterId];
      return this.textures.get(`${kit.id}-full`) ?? this.textures.get("rin-full")!;
    }
    if (actor.defId === "keeper") return this.textures.get("keeper-full")!;
    if (actor.defId === "boss" && actor.phase >= 2) return this.textures.get("boss2")!;
    const def = ENEMIES[actor.defId as EnemyId];
    const key = actor.defId === "boss" ? "boss1" : def?.id ?? "yokai";
    return this.textures.get(key) ?? this.textures.get("yokai")!;
  }

  sync(game: Game, alpha: number, dt: number): { fps: number; draws: number } {
    const st = game.state;
    if (this.env) {
      stepAtmosphere(this.env, dt, st.bossPhase >= 2);
      this.env.gateBar.visible = !st.gateOpen;
      this.env.crater.visible = st.arenaBroken;
    }
    const all = [st.player, ...st.actors];
    const live = new Set(all.map((a) => a.id));
    for (const a of all) {
      const view = this.ensureActor(a);
      if (a.defId === "boss" && a.phase >= 2) swapTexture(view, this.textures.get("boss2")!);
      syncCharacterView(view, a, alpha, this.camera);
    }
    for (const [id, view] of this.views) {
      if (!live.has(id)) {
        this.scene.remove(view.root);
        this.views.delete(id);
      }
    }
    for (const ev of st.vfx) {
      if (this.seenVfx.has(ev.id)) continue;
      this.seenVfx.add(ev.id);
      this.vfx.spawn(ev);
    }
    this.vfx.syncTelegraphs(st.actors);
    this.vfx.update(dt);

    const px = lerp(st.player.prevPos.x, st.player.pos.x, alpha);
    const py = lerp(st.player.prevPos.y, st.player.pos.y, alpha);
    const pz = lerp(st.player.prevPos.z, st.player.pos.z, alpha);
    syncCamera(this.camera, st.camera, { x: px, y: py, z: pz }, this.renderer.domElement.clientWidth / Math.max(1, this.renderer.domElement.clientHeight));

    this.fadeOccluders(new THREE.Vector3(px, py + 1.1, pz));

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    const info = this.renderer.info;
    return { fps: 0, draws: info.render.calls };
  }

  private fadeOccluders(player: THREE.Vector3): void {
    const cam = this.camera.position;
    const dir = player.clone().sub(cam);
    const dist = dir.length();
    dir.normalize();
    const ray = new THREE.Raycaster(cam, dir, 0.5, dist - 0.4);
    for (const m of this.fadeMats) {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat && "opacity" in mat) {
        mat.transparent = true;
        mat.opacity = 1;
      }
    }
    const hits = ray.intersectObjects(this.fadeMats, false);
    for (const h of hits) {
      const mat = (h.object as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.transparent = true;
        mat.opacity = 0.28;
      }
    }
  }

  pickGround(clientX: number, clientY: number): { x: number; z: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const y = this.views.get("player")?.root.position.y ?? 0;
    plane.constant = -y;
    if (ray.ray.intersectPlane(plane, hit)) return { x: hit.x, z: hit.z };
    return null;
  }

  worldToScreen(x: number, y: number, z: number): { x: number; y: number } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const el = this.renderer.domElement;
    return { x: (v.x * 0.5 + 0.5) * el.clientWidth, y: (-v.y * 0.5 + 0.5) * el.clientHeight };
  }
}

void cameraYaw;
void lerpAngle;
void KEEPER_DEF;
