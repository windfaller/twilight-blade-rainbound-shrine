import * as THREE from "three";
import type { Actor, VfxEvent } from "../game/types";

export class VfxWorld {
  root = new THREE.Group();
  private flashes: THREE.Mesh[] = [];
  private numbers: { sprite: THREE.Sprite; life: number }[] = [];

  constructor() {
    this.root.name = "vfx";
  }

  spawn(ev: VfxEvent): void {
    if (ev.kind === "numbers" && ev.text) {
      this.spawnNumber(ev);
      return;
    }
    const color = new THREE.Color(ev.color);
    const mesh = new THREE.Mesh(
      ev.kind === "slash" ? new THREE.RingGeometry(0.15, 0.55, 10, 1, 0, Math.PI) : new THREE.SphereGeometry(0.22 * ev.scale, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
    );
    mesh.position.set(ev.x, ev.y, ev.z);
    mesh.userData.life = ev.life;
    mesh.userData.max = ev.life;
    this.root.add(mesh);
    this.flashes.push(mesh);
  }

  spawnNumber(ev: VfxEvent): void {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 128, 64);
    ctx.font = "700 36px 'Noto Sans TC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = ev.color;
    ctx.strokeStyle = "#120c08";
    ctx.lineWidth = 6;
    ctx.strokeText(ev.text ?? "", 64, 44);
    ctx.fillText(ev.text ?? "", 64, 44);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const spr = new THREE.Sprite(mat);
    spr.position.set(ev.x, ev.y, ev.z);
    spr.scale.set(1.3, 0.65, 1);
    this.root.add(spr);
    this.numbers.push({ sprite: spr, life: ev.life });
  }

  syncTelegraphs(actors: Actor[]): void {
    for (const child of [...this.root.children]) {
      if (child.userData.tele) this.root.remove(child);
    }
    for (const a of actors) {
      if (!a.telegraph) continue;
      const t = a.telegraph;
      const g =
        t.kind === "circle"
          ? new THREE.RingGeometry(Math.max(0.1, t.width - 0.15), t.width, 24)
          : new THREE.PlaneGeometry(t.width, t.length);
      const m = new THREE.Mesh(
        g,
        new THREE.MeshBasicMaterial({ color: 0xff4a4a, transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(t.kind === "circle" ? t.x : t.x + Math.sin(t.yaw) * t.length * 0.5, a.pos.y + 0.06, t.kind === "circle" ? t.z : t.z + Math.cos(t.yaw) * t.length * 0.5);
      if (t.kind !== "circle") m.rotation.z = -t.yaw;
      m.userData.tele = true;
      this.root.add(m);
    }
  }

  update(dt: number): void {
    for (const m of this.flashes) {
      m.userData.life -= dt;
      const k = Math.max(0, m.userData.life / m.userData.max);
      (m.material as THREE.MeshBasicMaterial).opacity = k;
      m.scale.multiplyScalar(1 + dt * 1.8);
      if (m.userData.life <= 0) this.root.remove(m);
    }
    this.flashes = this.flashes.filter((m) => m.userData.life > 0);
    for (const n of this.numbers) {
      n.life -= dt;
      n.sprite.position.y += dt * 1.1;
      (n.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, n.life * 2);
      if (n.life <= 0) this.root.remove(n.sprite);
    }
    this.numbers = this.numbers.filter((n) => n.life > 0);
  }
}
