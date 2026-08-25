import * as THREE from "three";
import { poseFromActor } from "./animation";
import type { Actor } from "../game/types";

export interface CharacterView {
  id: string;
  root: THREE.Group;
  sprite: THREE.Mesh;
  shadow: THREE.Mesh;
  parts: Record<string, THREE.Object3D>;
}

const discardMat = (map: THREE.Texture, opacity = 1) =>
  new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity,
    alphaTest: 0.08,
  });

export function makeCharacterView(id: string, tex: THREE.Texture, height: number): CharacterView {
  const root = new THREE.Group();
  root.name = id;
  const aspect = 0.62;
  const geo = new THREE.PlaneGeometry(height * aspect, height, 6, 10);
  const mat = discardMat(tex);
  const sprite = new THREE.Mesh(geo, mat);
  sprite.position.y = height * 0.5;
  sprite.castShadow = true;
  const hip = new THREE.Group();
  hip.name = "hip";
  const torso = new THREE.Group();
  torso.name = "torso";
  const hair = new THREE.Group();
  hair.name = "hair";
  hair.position.y = height * 0.42;
  const hem = new THREE.Group();
  hem.name = "hem";
  const lLeg = new THREE.Group();
  lLeg.position.set(-0.08, -0.02, 0.01);
  const rLeg = new THREE.Group();
  rLeg.position.set(0.08, -0.02, 0.01);
  const lArm = new THREE.Group();
  lArm.position.set(-0.16, 0.22, 0.02);
  const rArm = new THREE.Group();
  rArm.position.set(0.16, 0.22, 0.02);
  const weapon = new THREE.Group();
  weapon.position.set(0.22, 0.08, 0.06);
  torso.add(hair, lArm, rArm, weapon);
  hip.add(torso, hem, lLeg, rLeg);
  hip.add(sprite);
  root.add(hip);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  return {
    id,
    root,
    sprite,
    shadow,
    parts: { hip, torso, hair, hem, lLeg, rLeg, lArm, rArm, weapon },
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
  view.sprite.quaternion.copy(cam.quaternion);
  const s = actor.height / 1.76;
  view.shadow.scale.setScalar(0.85 * s + Math.abs(pose.hipY));
  if (actor.iFramesUntil > 0 && actor.kind === "player") {
    (view.sprite.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(actor.anim.time * 40) * 0.25;
  } else {
    (view.sprite.material as THREE.MeshBasicMaterial).opacity = actor.dead ? 0.55 : 1;
  }
}

export function swapTexture(view: CharacterView, tex: THREE.Texture): void {
  const mat = view.sprite.material as THREE.MeshBasicMaterial;
  mat.map = tex;
  mat.needsUpdate = true;
}
