import { useEffect, useRef, useState } from "react";
import { ASSET_MANIFEST } from "./assets/manifest";
import { audio } from "./audio";
import { Game } from "./game/loop";
import { InputCollector } from "./game/input";
import { cameraYaw } from "./rendering/camera";
import { WorldRenderer } from "./rendering/scene";
import type { CharacterId, RelicId, UiSnapshot } from "./game/types";
import {
  ControlsScreen,
  DebugOverlay,
  DialogueBox,
  Hud,
  LoadingScreen,
  MenuScreen,
  PauseScreen,
  RelicScreen,
  ResultScreen,
  SelectScreen,
  SettingsScreen,
  UnlocksScreen,
} from "./ui";

const game = new Game();

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const inputRef = useRef(new InputCollector());
  const [snap, setSnap] = useState<UiSnapshot>(() => game.snapshot());
  const [fps, setFps] = useState(60);
  const [draws, setDraws] = useState(0);
  const worldReady = useRef(false);

  useEffect(() => game.subscribe(() => setSnap(game.snapshot())), []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new WorldRenderer(canvas);
    rendererRef.current = renderer;
    const input = inputRef.current;
    const detach = input.attach(canvas);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "F3") {
        e.preventDefault();
        game.enqueue({ type: "toggleDebug" });
      }
    };
    window.addEventListener("keydown", onKey);

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (game.state.screen !== "explore" && game.state.screen !== "combat") return;
      if (game.state.overlay) return;
      const hit = renderer.pickGround(e.clientX, e.clientY);
      if (!hit) return;
      input.pendingClick = { x: hit.x, z: hit.z, interact: null };
    };
    canvas.addEventListener("click", onClick);

    let mmb = false;
    const md = (e: MouseEvent) => {
      if (e.button === 1) mmb = true;
    };
    const mu = () => {
      mmb = false;
    };
    const mm = (e: MouseEvent) => {
      if (mmb) input.rotateAcc += e.movementX * 0.004;
    };
    window.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);
    window.addEventListener("mousemove", mm);

    let last = performance.now();
    let frames = 0;
    let accFps = 0;
    let raf = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      frames += 1;
      accFps += dt;
      if (accFps >= 0.4) {
        setFps(frames / accFps);
        frames = 0;
        accFps = 0;
      }
      const camYaw = cameraYaw(game.state.camera);
      const frame = input.sample(camYaw);
      game.tick(dt, frame);
      if (worldReady.current) {
        const info = renderer.sync(game, 0.5, dt);
        setDraws(info.draws);
      }
      if (game.state.sfx.length) {
        for (const s of game.state.sfx) audio.play(s);
        game.state.sfx.length = 0;
      }
      if (game.state.musicCue) audio.setCue(game.state.musicCue);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      const r = canvas.parentElement!.getBoundingClientRect();
      renderer.resize(r.width, r.height);
    });
    ro.observe(canvas.parentElement!);

    loadWorld(renderer).catch((err: Error) => {
      game.setLoading(game.state.loading.progress, "載入失敗", err.message);
    });

    return () => {
      cancelAnimationFrame(raf);
      detach();
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("mousedown", md);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("mousemove", mm);
    };
  }, []);

  useEffect(() => {
    audio.apply(snap.settings);
  }, [snap.settings]);

  useEffect(() => {
    const el = stickRef.current;
    if (!el) return;
    const input = inputRef.current;
    const setFrom = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const x = (cx - (r.left + r.width / 2)) / (r.width / 2);
      const y = (cy - (r.top + r.height / 2)) / (r.height / 2);
      input.stick.x = Math.max(-1, Math.min(1, x));
      input.stick.y = Math.max(-1, Math.min(1, y));
    };
    const end = () => {
      input.stick.x = 0;
      input.stick.y = 0;
    };
    const move = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length >= 2) {
        input.rotateAcc += (e.touches[1].clientX - e.touches[0].clientX) * 0.0004;
      }
      if (e.touches[0]) setFrom(e.touches[0].clientX, e.touches[0].clientY);
    };
    el.addEventListener("touchstart", move, { passive: false });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    return () => {
      el.removeEventListener("touchstart", move);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
    };
  }, [snap.screen]);

  const boot = async () => {
    await audio.resume();
  };

  const screen = snap.overlay ?? snap.screen;

  return (
    <div className="tb-root" onPointerDown={() => void boot()}>
      <div className="tb-canvas-host">
        <canvas ref={canvasRef} />
      </div>
      <div className="tb-ui">
        {screen === "loading" && <LoadingScreen loading={snap.loading} onRetry={() => { game.enqueue({ type: "retryLoad" }); void loadWorld(rendererRef.current!); }} />}
        {screen === "menu" && (
          <MenuScreen
            onStart={() => {
              void boot();
              game.enqueue({ type: "toSelect" });
            }}
            onControls={() => game.enqueue({ type: "toControls" })}
            onSettings={() => game.enqueue({ type: "toSettings" })}
            onUnlocks={() => game.enqueue({ type: "toUnlocks" })}
          />
        )}
        {screen === "controls" && (
          <ControlsScreen onBack={() => game.enqueue({ type: "toMenu" })} onPlay={() => game.enqueue({ type: "toSelect" })} />
        )}
        {screen === "select" && (
          <SelectScreen
            selected={snap.hoveredKit ?? snap.selectedKit}
            onHover={(id) => game.enqueue({ type: "hoverKit", id })}
            onSelect={(id: CharacterId) => game.enqueue({ type: "selectKit", id })}
            onConfirm={() => {
              void boot();
              game.enqueue({ type: "confirmKit" });
            }}
            onBack={() => game.enqueue({ type: "toMenu" })}
          />
        )}
        {screen === "settings" && (
          <SettingsScreen
            settings={snap.settings}
            onQuality={(quality) => game.enqueue({ type: "setQuality", quality })}
            onVol={(bus, value) => game.enqueue({ type: "setVolume", bus, value })}
            onBack={() => game.enqueue({ type: game.state.player.pos.z > 3 ? "resume" : "toMenu" })}
          />
        )}
        {screen === "unlocks" && <UnlocksScreen unlocks={snap.unlocks} onBack={() => game.enqueue({ type: "toMenu" })} />}
        {(snap.screen === "explore" || snap.screen === "combat") && !["menu", "select", "controls", "loading"].includes(screen) && (
          <Hud
            snap={snap}
            onPause={() => game.enqueue({ type: "pause" })}
            onInteract={() => {
              inputRef.current.interactBuf = true;
              game.enqueue({ type: "advanceDialogue" });
            }}
            onSkill={(i) => {
              inputRef.current.skillBuf[i] = true;
            }}
            onAttack={() => {
              inputRef.current.attackBuf = true;
            }}
            onDodge={() => {
              inputRef.current.dodgeBuf = true;
            }}
          />
        )}
        {snap.dialogue && (
          <DialogueBox
            speaker={snap.dialogue.speaker}
            portrait={snap.dialogue.portrait}
            text={snap.dialogue.text}
            last={snap.dialogue.last}
            onAdvance={() => game.enqueue({ type: "advanceDialogue" })}
          />
        )}
        {screen === "pause" && (
          <PauseScreen
            onResume={() => game.enqueue({ type: "resume" })}
            onSettings={() => game.enqueue({ type: "toSettings" })}
            onMenu={() => game.enqueue({ type: "toMenu" })}
          />
        )}
        {screen === "relic" && snap.relicChoices && (
          <RelicScreen choices={snap.relicChoices} onPick={(id: RelicId) => game.enqueue({ type: "pickRelic", id })} />
        )}
        {(screen === "victory" || screen === "defeat") && (
          <ResultScreen
            victory={screen === "victory"}
            time={snap.runTime}
            kills={snap.killCount}
            onRetry={() => game.enqueue({ type: "retry" })}
            onSelect={() => game.enqueue({ type: "nextRun" })}
            onUnlocks={() => game.enqueue({ type: "toUnlocks" })}
          />
        )}
        {snap.debug && rendererRef.current && <DebugOverlay game={game} fps={fps} draws={draws} />}
        {(snap.screen === "explore" || snap.screen === "combat") && (
          <div
            ref={stickRef}
            className="tb-stick"
            style={{
              position: "absolute",
              left: 24,
              bottom: 96,
              width: 112,
              height: 112,
              borderRadius: "50%",
              border: "1px solid rgba(224,180,90,0.35)",
              background: "rgba(8,12,22,0.35)",
            }}
          />
        )}
      </div>
    </div>
  );

  async function loadWorld(renderer: WorldRenderer) {
    try {
      game.setLoading(0.05, "讀取名冊…");
      await renderer.loadTextures(ASSET_MANIFEST, (n, id) => {
        game.setLoading(0.08 + n * 0.7, `裝載 ${id}`);
      });
      game.setLoading(0.86, "堆疊石階與鳥居…");
      renderer.build(game.state.settings.quality);
      renderer.resize(innerWidth, innerHeight);
      worldReady.current = true;
      game.setLoading(1, "山門已開");
    } catch (e) {
      game.setLoading(game.state.loading.progress, "素材缺失", e instanceof Error ? e.message : "load failed");
    }
  }
}
