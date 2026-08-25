import * as THREE from "three";
import { LANTERN_POINTS, TORII_GATES, groundHeight } from "../game/data/stages";
import { addLanternLight, type LightRig } from "./lighting";
import { makeWetStoneMaps, wetStoneMat } from "./wetstone";
import type { Quality } from "../game/types";

export interface EnvHandles {
  rain: THREE.LineSegments;
  mist: THREE.Group;
  maple: THREE.Points;
  gateBar: THREE.Mesh;
  crater: THREE.Mesh;
}

export function buildEnvironment(
  scene: THREE.Scene,
  textures: Record<string, THREE.Texture>,
  lights: LightRig,
  quality: Quality,
): EnvHandles {
  const verm = textures["tex-vermilion"];
  const wood = textures["tex-wood"];
  const far = textures["farscape"];
  verm.wrapS = verm.wrapT = THREE.RepeatWrapping;
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  verm.repeat.set(1, 1);
  wood.repeat.set(2, 2);

  const wet = makeWetStoneMaps();

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(210, 92),
    new THREE.MeshBasicMaterial({ map: far, depthWrite: false, fog: true }),
  );
  backdrop.position.set(8, 26, 148);
  backdrop.rotation.y = Math.PI;
  scene.add(backdrop);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(170, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x0a1018, side: THREE.BackSide }),
  );
  scene.add(sky);

  addGroundStrip(scene, wet, -7.4, 7.4, 3.4, 10.2, 0, 0x7a828c, 8.5);
  addStairs(scene, wet, 8, 24);
  addGroundStrip(scene, wet, -6.5, 6.5, 24, 30, 5);
  addGroundStrip(scene, wet, -8, 8.5, 29.5, 41, 5);
  addBridge(scene, wet, wood);
  addGroundStrip(scene, wet, -11, 12, 50.5, 74, 5);
  addGroundStrip(scene, wet, -9, 9, 75, 91, 5);
  addGroundStrip(scene, wet, -4, 4, 90.5, 97, 5);
  addGroundStrip(scene, wet, -11, 11, 96.5, 118, 5);

  for (const t of TORII_GATES) addTorii(scene, verm, wood, t.x, t.y, t.z, t.scale);
  for (const p of LANTERN_POINTS) {
    addLantern(scene, wet, wood, p.x, p.y, p.z);
    addLanternLight(scene, lights, p.x, p.y, p.z, quality);
  }

  addWalls(scene, wet);
  addMaples(scene, quality);
  addMoon(scene);
  addKeeperBeacon(scene);
  addPuddles(scene);

  const rain = makeRain(quality);
  scene.add(rain);
  const mist = makeMist(quality);
  scene.add(mist);
  const maple = makeMapleFall(quality);
  scene.add(maple);

  const gateBar = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 3.2, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x1b2438, emissive: 0x123040, metalness: 0.4, roughness: 0.4 }),
  );
  gateBar.position.set(0, 6.5, 93.4);
  gateBar.name = "gateBar";
  scene.add(gateBar);

  const crater = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.9, 0.35, 20),
    new THREE.MeshStandardMaterial({ color: 0x0a1422, emissive: 0x062030, roughness: 0.85 }),
  );
  crater.position.set(0, 4.78, 107);
  crater.visible = false;
  crater.name = "crater";
  scene.add(crater);

  return { rain, mist, maple, gateBar, crater };
}

function addGroundStrip(
  scene: THREE.Scene,
  wet: ReturnType<typeof makeWetStoneMaps>,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  y: number,
  tint = 0x7a828c,
  slab = 5.4,
): void {
  const w = maxX - minX;
  const d = maxZ - minZ;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.32, d),
    wetStoneMat(wet, Math.max(0.45, w / slab), Math.max(0.4, d / slab), tint),
  );
  mesh.position.set((minX + maxX) / 2, y - 0.15, (minZ + maxZ) / 2);
  mesh.receiveShadow = true;
  scene.add(mesh);
  const moss = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(0.9, w * 0.16), 0.06, Math.min(d, 6)),
    new THREE.MeshStandardMaterial({ color: 0x1c3324, roughness: 0.94 }),
  );
  moss.position.set(minX + 0.55, y + 0.03, (minZ + maxZ) / 2);
  scene.add(moss);
}

function addStairs(scene: THREE.Scene, wet: ReturnType<typeof makeWetStoneMaps>, z0: number, z1: number): void {
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const zA = z0 + (z1 - z0) * t0;
    const zB = z0 + (z1 - z0) * t1;
    const y = groundHeight(0, (zA + zB) / 2);
    const depth = Math.max(0.72, zB - zA + 0.06);
    const tread = new THREE.Mesh(
      new THREE.BoxGeometry(6.05, 0.38, depth),
      wetStoneMat(wet, 1.15, 0.32, 0x8a929c, i * 0.08, i * 0.11),
    );
    tread.position.set(0, y - 0.04, (zA + zB) / 2);
    tread.receiveShadow = true;
    tread.castShadow = true;
    const riser = new THREE.Mesh(
      new THREE.BoxGeometry(6.05, 0.46, 0.12),
      wetStoneMat(wet, 1.1, 0.18, 0x5c646e, 0.2, i * 0.07),
    );
    riser.position.set(0, y - 0.22, zA + 0.04);
    const cheekL = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.92, depth + 0.08),
      wetStoneMat(wet, 0.22, 0.34, 0x5a626c, 0.4, i * 0.09),
    );
    cheekL.position.set(-3.18, y + 0.28, (zA + zB) / 2);
    const cheekR = cheekL.clone();
    cheekR.position.x = 3.18;
    const mossL = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.07, Math.max(0.5, depth)),
      new THREE.MeshStandardMaterial({ color: 0x1c3324, roughness: 0.92 }),
    );
    mossL.position.set(-2.82, y + 0.14, (zA + zB) / 2);
    const mossR = mossL.clone();
    mossR.position.x = 2.82;
    scene.add(tread, riser, cheekL, cheekR, mossL, mossR);
  }
}

function addBridge(scene: THREE.Scene, wet: ReturnType<typeof makeWetStoneMaps>, wood: THREE.Texture): void {
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.32, 10.4), wetStoneMat(wet, 1.05, 1.9, 0x6a727c));
  deck.position.set(0, 4.95, 45.6);
  deck.receiveShadow = true;
  deck.castShadow = true;
  scene.add(deck);
  const woodMat = new THREE.MeshStandardMaterial({ map: wood, color: 0x4a3220, roughness: 0.7, metalness: 0.05 });
  for (const x of [-2.55, 2.55]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 10.2), woodMat);
    rail.position.set(x, 5.5, 45.6);
    scene.add(rail);
  }
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 8),
    new THREE.MeshStandardMaterial({ color: 0x0a1620, metalness: 0.82, roughness: 0.12, transparent: true, opacity: 0.88 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 3.55, 45.6);
  scene.add(water);
}

function addTorii(
  scene: THREE.Scene,
  verm: THREE.Texture,
  wood: THREE.Texture,
  x: number,
  y: number,
  z: number,
  scale: number,
): void {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    map: verm,
    color: 0xe24a36,
    roughness: 0.3,
    metalness: 0.12,
    emissive: 0x8a1c0c,
    emissiveIntensity: 1.05,
  });
  const dark = new THREE.MeshStandardMaterial({ map: wood, color: 0x2a1c12, roughness: 0.7, metalness: 0.05 });
  const h = 5.5 * scale;
  const gap = 3.15 * scale;
  const pL = new THREE.Mesh(new THREE.BoxGeometry(0.48 * scale, h, 0.48 * scale), mat);
  const pR = pL.clone();
  pL.position.set(-gap, h / 2, 0);
  pR.position.set(gap, h / 2, 0);
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(gap * 2 + 2.45 * scale, 0.32 * scale, 0.78 * scale), mat);
  kasagi.position.set(0, h + 0.2 * scale, 0);
  const shimaki = new THREE.Mesh(new THREE.BoxGeometry(gap * 2 + 1.7 * scale, 0.16 * scale, 0.5 * scale), mat);
  shimaki.position.set(0, h - 0.08 * scale, 0);
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(gap * 2 + 0.55 * scale, 0.2 * scale, 0.3 * scale), dark);
  nuki.position.set(0, h * 0.7, 0);
  const gaku = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.7 * scale, 0.12 * scale), dark);
  gaku.position.set(0, h * 0.82, 0.12 * scale);
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(gap * 0.9, 0.08 * scale, 6, 20, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xd2c094, roughness: 0.62, emissive: 0x3a2e18, emissiveIntensity: 0.2 }),
  );
  rope.position.set(0, h * 0.86, 0.1 * scale);
  rope.rotation.x = Math.PI;
  g.add(pL, pR, kasagi, shimaki, nuki, gaku, rope);
  for (let i = -1; i <= 1; i++) {
    const shide = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * scale, 0.32 * scale, 0.02 * scale),
      new THREE.MeshStandardMaterial({ color: 0xf2ead4, roughness: 0.55 }),
    );
    shide.position.set(i * 0.55 * scale, h * 0.78, 0.16 * scale);
    g.add(shide);
  }
  g.position.set(x, y, z);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  scene.add(g);
}

function addLantern(scene: THREE.Scene, wet: ReturnType<typeof makeWetStoneMaps>, wood: THREE.Texture, x: number, y: number, z: number): void {
  const g = new THREE.Group();
  const stone = wetStoneMat(wet, 0.45, 0.7, 0x7a828c);
  const woodMat = new THREE.MeshStandardMaterial({ map: wood, color: 0x3a2a1c, roughness: 0.68, metalness: 0.04 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.48, 0.18, 6), stone);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.14, 6), stone);
  plinth.position.y = 0.15;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.68, 8), stone);
  shaft.position.y = 0.56;
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.1, 6), stone);
  mid.position.y = 0.94;
  g.add(base, plinth, shaft, mid);
  for (const [px, pz] of [
    [-0.13, -0.13],
    [0.13, -0.13],
    [0.13, 0.13],
    [-0.13, 0.13],
  ] as const) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.36, 0.045), woodMat);
    post.position.set(px, 1.16, pz);
    g.add(post);
  }
  const paper = new THREE.MeshStandardMaterial({
    color: 0xffe2a8,
    emissive: 0xffb45a,
    emissiveIntensity: 1.55,
    roughness: 0.48,
    metalness: 0,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 4; i++) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), paper);
    const ang = (i * Math.PI) / 2;
    pane.position.set(Math.sin(ang) * 0.14, 1.16, Math.cos(ang) * 0.14);
    pane.rotation.y = ang;
    g.add(pane);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.2, 4), stone);
  roof.position.y = 1.44;
  roof.rotation.y = Math.PI / 4;
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb45a, transparent: true, opacity: 0.14, depthWrite: false }),
  );
  glow.position.y = 1.16;
  const moss = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x2f4a32, roughness: 0.95 }),
  );
  moss.position.set(0.18, 0.22, 0.1);
  moss.scale.set(1.4, 0.42, 1.1);
  g.add(roof, glow, moss);
  g.position.set(x, y, z);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  scene.add(g);
}

function addWalls(scene: THREE.Scene, wet: ReturnType<typeof makeWetStoneMaps>): void {
  const mat = wetStoneMat(wet, 0.28, 8.2, 0x4e5660);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 70), mat);
  left.position.set(-12.2, 6.1, 70);
  const right = left.clone();
  right.position.x = 13;
  const moss = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.4, 18),
    new THREE.MeshStandardMaterial({ color: 0x2a4a30, roughness: 0.9 }),
  );
  moss.position.set(-11.6, 5.2, 62);
  const moss2 = moss.clone();
  moss2.position.set(12.4, 5.2, 78);
  scene.add(left, right, moss, moss2);
}

function addMaples(scene: THREE.Scene, quality: Quality): void {
  const count = quality === "low" ? 6 : 12;
  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 3.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a2416 }),
    );
    trunk.position.y = 1.6;
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x9a2030, roughness: 0.7 }),
    );
    canopy.position.y = 3.3;
    g.add(trunk, canopy);
    const side = i % 2 === 0 ? -1 : 1;
    g.position.set(side * (10 + (i % 3)), 5, 52 + i * 5.2);
    scene.add(g);
  }
}

function addKeeperBeacon(scene: THREE.Scene): void {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 0.95, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  g.add(ring);
  g.position.set(2.15, 5, 33.4);
  scene.add(g);
}

function addMoon(scene: THREE.Scene): void {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3.4, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xe8f0ff }),
  );
  moon.position.set(-16, 22, 4);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(5.4, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xc8d8f0, transparent: true, opacity: 0.12, depthWrite: false }),
  );
  halo.position.copy(moon.position);
  scene.add(moon, halo);
}

function addPuddles(scene: THREE.Scene): void {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a2430,
    metalness: 0.86,
    roughness: 0.08,
    envMapIntensity: 1.4,
    transparent: true,
    opacity: 0.72,
  });
  for (const [x, z, s] of [
    [-1.1, 7.1, 0.85],
    [1.35, 8.05, 0.62],
    [0.2, 6.7, 0.5],
    [-2.1, 12.4, 0.7],
  ] as const) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(s, 18), mat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, groundHeight(x, z) + 0.03, z);
    scene.add(p);
  }
}

function makeRain(quality: Quality): THREE.LineSegments {
  const n = quality === "high" ? 1900 : quality === "med" ? 1000 : 420;
  const pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const near = i < n * 0.55;
    const x = (Math.random() - 0.5) * (near ? 18 : 46);
    const y = Math.random() * 16 + (near ? 1 : 0);
    const z = near ? 4 + Math.random() * 28 : Math.random() * 130 - 4;
    const i6 = i * 6;
    pos[i6] = x;
    pos[i6 + 1] = y;
    pos[i6 + 2] = z;
    pos[i6 + 3] = x + 0.05;
    pos[i6 + 4] = y - 1.45;
    pos[i6 + 5] = z + 0.03;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color: 0xe8f2fc, transparent: true, opacity: 0.72 }),
  );
}

function mistTex(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 6, 64, 64, 58);
  grd.addColorStop(0, "rgba(168,184,204,0.4)");
  grd.addColorStop(1, "rgba(168,184,204,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeMist(quality: Quality): THREE.Group {
  const g = new THREE.Group();
  const n = quality === "low" ? 6 : 10;
  const tex = mistTex();
  for (let i = 0; i < n; i++) {
    const spr = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.34, fog: true }),
    );
    spr.scale.set(5.2 + (i % 3), 1.35, 1);
    spr.position.set((i % 2 === 0 ? -1 : 1) * 1.8, 0.55 + (i % 3) * 0.08, 7.2 + i * 3.4);
    g.add(spr);
  }
  return g;
}

function makeMapleFall(quality: Quality): THREE.Points {
  const n = quality === "high" ? 80 : 36;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 24;
    pos[i * 3 + 1] = 6 + Math.random() * 8;
    pos[i * 3 + 2] = 48 + Math.random() * 62;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xc43b2a, size: 0.12, transparent: true, opacity: 0.8 }));
}

export function stepAtmosphere(env: EnvHandles, dt: number, heavy: boolean): void {
  const rain = env.rain.geometry.getAttribute("position") as THREE.BufferAttribute;
  const fall = heavy ? 22 : 15;
  for (let i = 0; i < rain.count; i += 2) {
    let y0 = rain.getY(i) - dt * fall;
    let y1 = rain.getY(i + 1) - dt * fall;
    if (y0 < 0) {
      const ny = 12 + Math.random() * 5;
      y0 = ny;
      y1 = ny - 1.45;
    }
    rain.setY(i, y0);
    rain.setY(i + 1, y1);
  }
  rain.needsUpdate = true;
  env.mist.children.forEach((c, i) => {
    c.position.x += Math.sin(i + performance.now() * 0.00025) * dt * 0.12;
  });
  const maple = env.maple.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < maple.count; i++) {
    let y = maple.getY(i) - dt * 0.7;
    let x = maple.getX(i) + Math.sin(y + i) * dt * 0.4;
    if (y < 5) {
      y = 12;
      x = (Math.random() - 0.5) * 24;
    }
    maple.setY(i, y);
    maple.setX(i, x);
  }
  maple.needsUpdate = true;
}
