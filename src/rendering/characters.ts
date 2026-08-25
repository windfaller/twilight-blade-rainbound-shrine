import * as THREE from "three";
import { poseFromActor } from "./animation";
import type { Actor } from "../game/types";

export interface CharacterView {
  id: string;
  root: THREE.Group;
  billboard: THREE.Group;
  sprite: THREE.Mesh;
  shadow: THREE.Mesh;
  parts: Record<string, THREE.Object3D>;
  overlays: THREE.Mesh[];
}

function litSprite(map: THREE.Texture, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity,
    alphaTest: 0.08,
    roughness: 0.36,
    metalness: 0.08,
    emissive: new THREE.Color(0x3a2412),
    emissiveIntensity: 0.2,
    envMapIntensity: 0.85,
  });
}

function bladeMesh(): THREE.Mesh {
  const geo = new THREE.BoxGeometry(0.06, 0.92, 0.03);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d3,
    metalness: 0.78,
    roughness: 0.18,
    emissive: 0x3a2a12,
    emissiveIntensity: 0.35,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0.04, 0.2, 0.08);
  mesh.rotation.z = -0.35;
  mesh.castShadow = true;
  return mesh;
}

export function makeCharacterView(id: string, tex: THREE.Texture, height: number): CharacterView {
  const root = new THREE.Group();
  root.name = id;
  const billboard = new THREE.Group();
  billboard.name = "billboard";
  const visH = height * 1.58;
  const img = tex.image as { width?: number; height?: number } | undefined;
  const aspect = img?.width && img?.height ? Math.min(0.72, Math.max(0.42, img.width / img.height)) : 0.52;
  const w = visH * aspect;
  const body = new THREE.Mesh(new THREE.PlaneGeometry(w, visH, 6, 10), litSprite(tex));
  body.position.y = visH * 0.5;
  body.castShadow = true;

  const hair = new THREE.Group();
  hair.name = "hair";
  const hem = new THREE.Group();
  hem.name = "hem";

  const hip = new THREE.Group();
  hip.name = "hip";
  const torso = new THREE.Group();
  torso.name = "torso";
  const lLeg = new THREE.Group();
  lLeg.position.set(-0.1, visH * 0.16, 0.02);
  const rLeg = new THREE.Group();
  rLeg.position.set(0.1, visH * 0.16, 0.02);
  const lArm = new THREE.Group();
  lArm.position.set(-w * 0.2, visH * 0.56, 0.03);
  const rArm = new THREE.Group();
  rArm.position.set(w * 0.2, visH * 0.56, 0.03);
  const weapon = new THREE.Group();
  weapon.position.set(w * 0.16, visH * 0.46, 0.07);
  const blade = bladeMesh();
  blade.scale.setScalar(visH / 1.76);
  weapon.add(blade);

  torso.add(hair, lArm, rArm, weapon);
  hip.add(torso, hem, lLeg, rLeg, body);
  billboard.add(hip);
  root.add(billboard);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 22),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.58, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.scale.set(1.15, 0.72, 1);
  const soft = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 22),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
  );
  soft.rotation.x = -Math.PI / 2;
  soft.position.y = 0.018;
  root.add(shadow, soft);

  return {
    id,
    root,
    billboard,
    sprite: body,
    shadow,
    parts: { hip, torso, hair, hem, lLeg, rLeg, lArm, rArm, weapon },
    overlays: [],
  };
}

export function syncCharacterView(view: CharacterView, actor: Actor, alpha: number, cam: THREE.Camera): void {
  const x = actor.prevPos.x + (actor.pos.x - actor.prevPos.x) * alpha;
  const y = actor.prevPos.y + (actor.pos.y - actor.prevPos.y) * alpha;
  const z = actor.prevPos.z + (actor.pos.z - actor.prevPos.z) * alpha;
  view.root.position.set(x, y, z);
  view.root.visible = !actor.hidden && !(actor.dead && actor.anim.time > 2.4);
  const pose = poseFromActor(actor, alpha);
  const hip = view.parts.hip;
  hip.position.y = pose.hipY;
  hip.rotation.z = pose.hipRoll;
  hip.scale.set(1, pose.squash, 1);
  view.parts.torso.rotation.x = pose.torsoBend;
  view.parts.hair.rotation.z = pose.hairSwing;
  view.parts.hem.rotation.z = pose.hemSwing;
  view.parts.lLeg.rotation.x = pose.lLeg;
  view.parts.rLeg.rotation.x = pose.rLeg;
  view.parts.lArm.rotation.x = pose.lArm;
  view.parts.rArm.rotation.x = pose.rArm;
  view.parts.weapon.rotation.z = pose.weapon;
  view.billboard.quaternion.copy(cam.quaternion);
  const s = (actor.height * 1.58) / 1.76;
  view.shadow.scale.set(1.05 * s + Math.abs(pose.hipY), 0.7 * s, 1);
  const mats = [view.sprite, ...view.overlays].map((m) => m.material as THREE.MeshStandardMaterial);
  const op =
    actor.iFramesUntil > 0 && actor.kind === "player" ? 0.55 + Math.sin(actor.anim.time * 40) * 0.25 : actor.dead ? 0.55 : 1;
  mats[0].opacity = op;
  for (let i = 1; i < mats.length; i++) mats[i].opacity = op * 0.68;
}

export function swapTexture(view: CharacterView, tex: THREE.Texture): void {
  const apply = (mesh: THREE.Mesh) => {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat.map) {
      mat.map = tex;
      mat.needsUpdate = true;
    }
  };
  apply(view.sprite);
  for (const o of view.overlays) apply(o);
}
