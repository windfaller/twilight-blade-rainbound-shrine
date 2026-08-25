import * as THREE from "three";
import { LANTERN_POINTS, TORII_GATES, groundHeight } from "../game/data/stages";
import { addLanternLight, type LightRig } from "./lighting";
import type { Quality } from "../game/types";

export interface EnvHandles {
  rain: THREE.LineSegments;
  mist: THREE.Group;
  maple: THREE.Points;
  gateBar: THREE.Mesh;
  crater: THREE.Mesh;
}

function texMat(map: THREE.Texture, color = 0xffffff, rough = 0.18, metal = 0.38): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map,
    color,
    roughness: rough,
    metalness: metal,
    envMapIntensity: 0.85,
  });
}

export function buildEnvironment(
  scene: THREE.Scene,
  textures: Record<string, THREE.Texture>,
  lights: LightRig,
  quality: Quality,
): EnvHandles {
  const stone = textures["tex-stone"];
  const verm = textures["tex-vermilion"];
  const wood = textures["tex-wood"];
  const far = textures["farscape"];
  stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
  verm.wrapS = verm.wrapT = THREE.RepeatWrapping;
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  stone.repeat.set(6, 18);
  verm.repeat.set(1, 1);
  wood.repeat.set(2, 2);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(210, 92),
    new THREE.MeshBasicMaterial({ map: far, depthWrite: false, fog: true }),
  );
  backdrop.position.set(8, 26, 148);
  backdrop.rotation.y = Math.PI;
  scene.add(backdrop);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(170, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x070a10, side: THREE.BackSide }),
  );
  scene.add(sky);

  addGroundStrip(scene, stone, -7, 7, -2, 9, 0);
  addStairs(scene, stone, 8, 24);
  addGroundStrip(scene, stone, -6.5, 6.5, 24, 30, 5);
  addGroundStrip(scene, stone, -8, 8.5, 29.5, 41, 5);
  addBridge(scene, stone, wood);
  addGroundStrip(scene, stone, -11, 12, 50.5, 74, 5);
  addGroundStrip(scene, stone, -9, 9, 75, 91, 5);
  addGroundStrip(scene, stone, -4, 4, 90.5, 97, 5);
  addGroundStrip(scene, stone, -11, 11, 96.5, 118, 5);

  for (const t of TORII_GATES) addTorii(scene, verm, wood, t.x, t.y, t.z, t.scale);
  for (const p of LANTERN_POINTS) {
    addLantern(scene, stone, wood, p.x, p.y, p.z);
    addLanternLight(scene, lights, p.x, p.y, p.z, quality);
  }

  addWalls(scene, stone, wood);
  addMaples(scene, quality);
  addMoon(scene);
  addPathBeacons(scene);
  addKeeperBeacon(scene);

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
  map: THREE.Texture,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  y: number,
): void {
  const w = maxX - minX;
  const d = maxZ - minZ;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.35, d),
    texMat(map, 0x8a96a4, 0.16, 0.42),
  );
  mesh.position.set((minX + maxX) / 2, y - 0.16, (minZ + maxZ) / 2);
  mesh.receiveShadow = true;
  scene.add(mesh);
  const moss = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(1.4, w * 0.18), 0.07, Math.min(d, 8)),
    new THREE.MeshStandardMaterial({ color: 0x2a4630, roughness: 0.94 }),
  );
  moss.position.set(minX + 0.7, y + 0.04, (minZ + maxZ) / 2);
  scene.add(moss);
}

function addStairs(scene: THREE.Scene, map: THREE.Texture, z0: number, z1: number): void {
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const zA = z0 + (z1 - z0) * t0;
    const zB = z0 + (z1 - z0) * t1;
    const y = groundHeight(0, (zA + zB) / 2);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.42, Math.max(0.7, zB - zA + 0.08)),
      texMat(map, 0x8793a1, 0.16, 0.4),
    );
    mesh.position.set(0, y - 0.05, (zA + zB) / 2);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
    if (i % 2 === 0) {
      const railL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, zB - zA), new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.7 }));
      railL.position.set(-4.2, y + 0.4, (zA + zB) / 2);
      const railR = railL.clone();
      railR.position.x = 4.2;
      const mossL = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.08, Math.max(0.6, zB - zA)),
        new THREE.MeshStandardMaterial({ color: 0x2a4630, roughness: 0.92 }),
      );
      mossL.position.set(-3.7, y + 0.12, (zA + zB) / 2);
      const mossR = mossL.clone();
      mossR.position.x = 3.7;
      scene.add(railL, railR, mossL, mossR);
    }
  }
}

function addBridge(scene: THREE.Scene, stone: THREE.Texture, wood: THREE.Texture): void {
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.32, 10.4), texMat(stone, 0x7e8a96, 0.14, 0.46));
  deck.position.set(0, 4.95, 45.6);
  deck.receiveShadow = true;
  deck.castShadow = true;
  scene.add(deck);
  for (const x of [-2.55, 2.55]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 10.2), texMat(wood, 0x4a3220, 0.7, 0.05));
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
    color: 0xc43b2a,
    roughness: 0.38,
    metalness: 0.08,
    emissive: 0x4a1208,
    emissiveIntensity: 0.42,
  });
  const dark = texMat(wood, 0x2a1c12, 0.7, 0.05);
  const h = 5.4 * scale;
  const gap = 3.5 * scale;
  const pL = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, h, 0.42 * scale), mat);
  const pR = pL.clone();
  pL.position.set(-gap, h / 2, 0);
  pR.position.set(gap, h / 2, 0);
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(gap * 2 + 2.2 * scale, 0.28 * scale, 0.7 * scale), mat);
  kasagi.position.set(0, h + 0.15, 0);
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(gap * 2 + 0.6 * scale, 0.18 * scale, 0.28 * scale), dark);
  nuki.position.set(0, h * 0.72, 0);
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(gap * 0.92, 0.07 * scale, 6, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.7 }),
  );
  rope.position.set(0, h * 0.86, 0.08 * scale);
  rope.rotation.x = Math.PI;
  g.add(pL, pR, kasagi, nuki, rope);
  g.position.set(x, y, z);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  scene.add(g);
}

function addLantern(scene: THREE.Scene, stone: THREE.Texture, wood: THREE.Texture, x: number, y: number, z: number): void {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.22, 8), texMat(stone, 0x8a9098, 0.6, 0.1));
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.7, 8), texMat(wood, 0x3a2a1c, 0.7, 0.05));
  pillar.position.y = 0.45;
  const house = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.38, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xffc56a, emissive: 0xff9a32, emissiveIntensity: 2.1, roughness: 0.28 }),
  );
  house.position.y = 0.95;
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb45a, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  glow.position.y = 0.95;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.22, 4), texMat(stone, 0x5a626c, 0.55, 0.1));
  roof.position.y = 1.22;
  roof.rotation.y = Math.PI / 4;
  const moss = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x2f4a32, roughness: 0.95 }),
  );
  moss.position.set(0.16, 0.28, 0.1);
  moss.scale.set(1.4, 0.45, 1.1);
  g.add(base, pillar, house, glow, roof, moss);
  g.position.set(x, y, z);
  scene.add(g);
}

function addWalls(scene: THREE.Scene, stone: THREE.Texture, wood: THREE.Texture): void {
  const mat = texMat(stone, 0x5a646e, 0.55, 0.12);
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
  void wood;
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

function addPathBeacons(scene: THREE.Scene): void {
  const spots = [
    [0, 0.4, 6],
    [0, 1.6, 14],
    [0, 3.4, 20],
    [0, 5.6, 26],
    [2.1, 6.4, 33.4],
    [0, 5.6, 45],
    [0, 5.6, 56],
    [0, 5.6, 64],
    [0, 5.6, 70],
    [0, 5.6, 83],
    [0, 5.6, 104],
  ];
  for (const [x, y, z] of spots) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd27a }),
    );
    orb.position.set(x, y + 1.4, z);
    scene.add(orb);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6),
      new THREE.MeshBasicMaterial({ color: 0xffc56a, transparent: true, opacity: 0.28 }),
    );
    shaft.position.set(x, y + 2.2, z);
    scene.add(shaft);
  }
}

function addKeeperBeacon(scene: THREE.Scene): void {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 0.95, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 5.2, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.22 }),
  );
  column.position.y = 2.6;
  g.add(ring, column);
  g.position.set(2.15, 5, 33.4);
  scene.add(g);
}

function addMoon(scene: THREE.Scene): void {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xe8f0ff }),
  );
  moon.position.set(-22, 34, 8);
  scene.add(moon);
}

function makeRain(quality: Quality): THREE.LineSegments {
  const n = quality === "high" ? 720 : quality === "med" ? 420 : 180;
  const pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * 46;
    const y = Math.random() * 18;
    const z = Math.random() * 130 - 4;
    const i6 = i * 6;
    pos[i6] = x;
    pos[i6 + 1] = y;
    pos[i6 + 2] = z;
    pos[i6 + 3] = x + 0.08;
    pos[i6 + 4] = y - 0.95;
    pos[i6 + 5] = z + 0.04;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color: 0xb7c8dc, transparent: true, opacity: 0.38 }),
  );
}

function makeMist(quality: Quality): THREE.Group {
  const g = new THREE.Group();
  const n = quality === "low" ? 5 : 8;
  for (let i = 0; i < n; i++) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(18 + (i % 3) * 4, 3.2),
      new THREE.MeshBasicMaterial({
        color: 0x8a9bb0,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set((i % 2 === 0 ? -1 : 1) * 4, 5.35 + (i % 3) * 0.12, 18 + i * 12);
    g.add(plane);
  }
  return g;
}

function makeMapleFall(quality: Quality): THREE.Points {
  const n = quality === "high" ? 80 : 36;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 24;
    pos[i * 3 + 1] = 6 + Math.random() * 8;
    pos[i * 3 + 2] = 40 + Math.random() * 70;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xc43b2a, size: 0.16, transparent: true, opacity: 0.85 }));
}

export function stepAtmosphere(env: EnvHandles, dt: number, heavy: boolean): void {
  const rain = env.rain.geometry.getAttribute("position") as THREE.BufferAttribute;
  const fall = heavy ? 18 : 12;
  for (let i = 0; i < rain.count; i += 2) {
    let y0 = rain.getY(i) - dt * fall;
    let y1 = rain.getY(i + 1) - dt * fall;
    if (y0 < 0) {
      const ny = 16 + Math.random() * 4;
      y0 = ny;
      y1 = ny - 0.95;
    }
    rain.setY(i, y0);
    rain.setY(i + 1, y1);
  }
  rain.needsUpdate = true;
  env.mist.rotation.y += dt * 0.01;
  env.mist.children.forEach((c, i) => {
    c.position.x += Math.sin(i + performance.now() * 0.0002) * dt * 0.15;
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
