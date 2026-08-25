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
    alphaTest: 0.06,
    roughness: 0.42,
    metalness: 0.06,
    emissive: new THREE.Color(0x4a2e14),
    emissiveIntensity: 0.32,
    envMapIntensity: 0.7,
  });
}

function uvPlane(w: number, h: number, u0: number, v0: number, u1: number, v1: number): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(w, h, 4, 6);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    uv.setXY(i, u0 + u * (u1 - u0), v0 + v * (v1 - v0));
  }
  return geo;
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
  const aspect = 0.62;
  const w = height * aspect;
  const body = new THREE.Mesh(new THREE.PlaneGeometry(w, height, 6, 10), litSprite(tex));
  body.position.y = height * 0.5;
  body.castShadow = true;

  const hair = new THREE.Group();
  hair.name = "hair";
  const hairMesh = new THREE.Mesh(uvPlane(w * 0.9, height * 0.4, 0.12, 0.62, 0.88, 1), litSprite(tex, 0.92));
  hairMesh.position.set(0, height * 0.78, 0.04);
  hair.add(hairMesh);

  const hem = new THREE.Group();
  hem.name = "hem";
  const hemMesh = new THREE.Mesh(uvPlane(w * 1.02, height * 0.34, 0.08, 0, 0.92, 0.34), litSprite(tex, 0.88));
  hemMesh.position.set(0, height * 0.2, 0.035);
  hem.add(hemMesh);

  const hip = new THREE.Group();
  hip.name = "hip";
  const torso = new THREE.Group();
  torso.name = "torso";
  const lLeg = new THREE.Group();
  lLeg.position.set(-0.1, height * 0.18, 0.02);
  const rLeg = new THREE.Group();
  rLeg.position.set(0.1, height * 0.18, 0.02);
  const lArm = new THREE.Group();
  lArm.position.set(-w * 0.22, height * 0.58, 0.03);
  const rArm = new THREE.Group();
  rArm.position.set(w * 0.22, height * 0.58, 0.03);
  const weapon = new THREE.Group();
  weapon.position.set(w * 0.18, height * 0.48, 0.07);
  const blade = bladeMesh();
  blade.scale.setScalar(height / 1.76);
  weapon.add(blade);

  const clothHint = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.34, height * 0.22),
    new THREE.MeshStandardMaterial({
      color: 0x8a2030,
      transparent: true,
      opacity: 0.22,
      roughness: 0.55,
      metalness: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  clothHint.position.set(0.02, height * 0.32, 0.05);
  hem.add(clothHint);

  torso.add(hair, lArm, rArm, weapon);
  hip.add(torso, hem, lLeg, rLeg, body);
  billboard.add(hip);
  root.add(billboard);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  return {
    id,
    root,
    billboard,
    sprite: body,
    shadow,
    parts: { hip, torso, hair, hem, lLeg, rLeg, lArm, rArm, weapon },
    overlays: [hairMesh, hemMesh],
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
  const s = actor.height / 1.76;
  view.shadow.scale.setScalar(0.85 * s + Math.abs(pose.hipY));
  const mats = [view.sprite, ...view.overlays].map((m) => m.material as THREE.MeshStandardMaterial);
  const op =
    actor.iFramesUntil > 0 && actor.kind === "player" ? 0.55 + Math.sin(actor.anim.time * 40) * 0.25 : actor.dead ? 0.55 : 1;
  for (const mat of mats) mat.opacity = op;
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
