import type { Game } from "../game/loop";

export function DebugOverlay({ game, fps, draws }: { game: Game; fps: number; draws: number }) {
  const s = game.state;
  const p = s.player;
  return (
    <pre
      style={{
        position: "absolute",
        left: 10,
        top: 80,
        background: "rgba(0,0,0,0.55)",
        color: "#cde",
        padding: 8,
        fontSize: 12,
        pointerEvents: "none",
      }}
    >
      {`FPS ${fps.toFixed(0)}  draws ${draws}
pos ${p.pos.x.toFixed(2)} ${p.pos.y.toFixed(2)} ${p.pos.z.toFixed(2)}
screen ${s.screen} enc ${s.encounter?.id ?? "-"}
relics ${s.relics.join(",") || "-"}
nav ${game.nav.cols}x${game.nav.rows} path ${s.path.waypoints.length}
gate ${s.gateOpen ? 1 : 0} phase ${s.bossPhase}`}
    </pre>
  );
}
