import type { InputFrame } from "./types";

export function emptyInput(): InputFrame {
  return {
    moveX: 0,
    moveZ: 0,
    attack: false,
    dodge: false,
    skills: [false, false, false],
    interact: false,
    pointerWorld: null,
    clickPath: false,
    clickInteractId: null,
    pause: false,
    rotate: 0,
    zoomDelta: 0,
  };
}

export class InputCollector {
  keys = new Set<string>();
  frame = emptyInput();
  stick = { x: 0, y: 0 };
  pendingClick: { x: number; z: number; interact: string | null } | null = null;
  rotateAcc = 0;
  zoomAcc = 0;
  attackBuf = false;
  dodgeBuf = false;
  skillBuf: [boolean, boolean, boolean] = [false, false, false];
  interactBuf = false;
  pauseBuf = false;

  attach(el: HTMLElement): () => void {
    const down = (e: KeyboardEvent) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.code === "KeyE" || e.code === "Space") this.interactBuf = true;
      if (e.code === "KeyF" || e.code === "Digit3") this.skillBuf[2] = true;
      if (e.code === "KeyQ" || e.code === "Digit1") this.skillBuf[0] = true;
      if (e.code === "KeyR" || e.code === "Digit2") this.skillBuf[1] = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") this.dodgeBuf = true;
      if (e.code === "Escape") this.pauseBuf = true;
      if (e.code === "F3") {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const md = (e: MouseEvent) => {
      if (e.button === 0) this.attackBuf = true;
      if (e.button === 2) this.dodgeBuf = true;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      this.zoomAcc += Math.sign(e.deltaY) * 0.85;
    };
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    el.addEventListener("mousedown", md);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("contextmenu", ctx);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      el.removeEventListener("mousedown", md);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", ctx);
    };
  }

  sample(camYaw: number): InputFrame {
    let kx = 0;
    let kz = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) kx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) kx += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) kz -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) kz += 1;
    kx += this.stick.x;
    kz += this.stick.y;
    const cs = Math.cos(camYaw);
    const sn = Math.sin(camYaw);
    const moveX = kx * cs + kz * sn;
    const moveZ = -kx * sn + kz * cs;
    const f: InputFrame = {
      moveX,
      moveZ,
      attack: this.attackBuf || this.keys.has("KeyJ"),
      dodge: this.dodgeBuf,
      skills: [...this.skillBuf],
      interact: this.interactBuf,
      pointerWorld: this.pendingClick ? { x: this.pendingClick.x, z: this.pendingClick.z } : null,
      clickPath: !!this.pendingClick && !this.pendingClick.interact,
      clickInteractId: this.pendingClick?.interact ?? null,
      pause: this.pauseBuf,
      rotate: this.rotateAcc,
      zoomDelta: this.zoomAcc,
    };
    this.attackBuf = false;
    this.dodgeBuf = false;
    this.skillBuf = [false, false, false];
    this.interactBuf = false;
    this.pauseBuf = false;
    this.pendingClick = null;
    this.rotateAcc = 0;
    this.zoomAcc = 0;
    return f;
  }
}
