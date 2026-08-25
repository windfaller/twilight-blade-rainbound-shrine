import type { SettingsState } from "../game/types";

export class AudioBus {
  ctx: AudioContext | null = null;
  settings: SettingsState = { quality: "high", music: 0.7, sfx: 0.85, ambience: 0.55 };
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private amb: GainNode | null = null;
  private cue = "";
  private timers: number[] = [];
  private started = false;

  async resume(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.amb = this.ctx.createGain();
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.amb.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.apply();
    }
    if (this.ctx.state !== "running") await this.ctx.resume();
    this.started = true;
  }

  apply(settings?: SettingsState): void {
    if (settings) this.settings = settings;
    if (!this.music || !this.sfx || !this.amb) return;
    this.music.gain.value = this.settings.music * 0.35;
    this.sfx.gain.value = this.settings.sfx * 0.55;
    this.amb.gain.value = this.settings.ambience * 0.4;
  }

  setCue(cue: string): void {
    if (cue === this.cue || !this.ctx || !this.started) {
      this.cue = cue;
      return;
    }
    this.cue = cue;
    this.clearLoops();
    this.loopBed(cue);
  }

  play(name: string): void {
    if (!this.ctx || !this.sfx || !this.started) return;
    const now = this.ctx.currentTime;
    if (name === "hit") this.noiseBurst(180, 0.07, "triangle", 0.18);
    else if (name === "slash") this.noiseBurst(420, 0.09, "sawtooth", 0.12);
    else if (name === "kill") this.chord([220, 330, 440], 0.22);
    else if (name === "dodge") this.noiseBurst(720, 0.08, "sine", 0.1);
    else if (name === "skill" || name === "cast") this.noiseBurst(520, 0.12, "triangle", 0.14);
    else if (name === "ult") this.chord([196, 247, 392, 588], 0.45);
    else if (name === "bless" || name === "relic") this.chord([262, 330, 392], 0.35);
    else if (name === "phase") this.chord([98, 147, 196], 0.6);
    else if (name === "encounter") this.chord([110, 165], 0.3);
    else if (name === "ui" || name === "talk") this.blip(660, 0.05);
    else if (name === "gate") this.chord([130, 196, 262], 0.4);
    else if (name === "enemy") this.blip(140, 0.06);
    else this.blip(300, 0.04);
    void now;
  }

  private osc(freq: number, dur: number, type: OscillatorType, gain: number, dest: GainNode): void {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(dest);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.02);
  }

  private noiseBurst(freq: number, dur: number, type: OscillatorType, gain: number): void {
    if (!this.sfx) return;
    this.osc(freq, dur, type, gain, this.sfx);
    this.osc(freq * 1.5, dur * 0.8, "sine", gain * 0.4, this.sfx);
  }

  private chord(freqs: number[], dur: number): void {
    if (!this.sfx) return;
    for (const f of freqs) this.osc(f, dur, "triangle", 0.08, this.sfx);
  }

  private blip(freq: number, dur: number): void {
    if (!this.sfx) return;
    this.osc(freq, dur, "sine", 0.1, this.sfx);
  }

  private loopBed(cue: string): void {
    if (!this.ctx || !this.music || !this.amb) return;
    const mood =
      cue === "boss2" ? [55, 82, 110, 164] : cue === "boss1" || cue === "elite" ? [65, 98, 130] : cue === "combat" ? [73, 110, 146] : cue === "victory" ? [196, 247, 330] : [82, 123, 164];
    const pulse = () => {
      if (!this.ctx || !this.music) return;
      for (const f of mood) this.osc(f, 1.6, "sine", 0.05, this.music);
      this.osc(mood[0] * 2, 0.25, "triangle", 0.03, this.music);
    };
    pulse();
    this.timers.push(window.setInterval(pulse, cue.includes("boss") ? 1400 : 1800));
    const drip = () => {
      if (!this.ctx || !this.amb) return;
      this.osc(880 + Math.random() * 400, 0.05, "sine", 0.02, this.amb);
    };
    this.timers.push(window.setInterval(drip, 220));
  }

  private clearLoops(): void {
    for (const t of this.timers) window.clearInterval(t);
    this.timers = [];
  }
}

export const audio = new AudioBus();
