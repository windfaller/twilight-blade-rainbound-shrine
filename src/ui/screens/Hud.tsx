import { CHARACTERS } from "../../game/data/characters";
import type { UiSnapshot } from "../../game/types";

export function Hud({
  snap,
  onPause,
  onInteract,
  onGoObjective,
  onSkill,
  onAttack,
  onDodge,
}: {
  snap: UiSnapshot;
  onPause: () => void;
  onInteract: () => void;
  onGoObjective: () => void;
  onSkill: (i: 0 | 1 | 2) => void;
  onAttack: () => void;
  onDodge: () => void;
}) {
  const kit = CHARACTERS[snap.player.id];
  const hp = snap.player.hp / snap.player.maxHp;
  const sp = snap.player.spirit / snap.player.maxSpirit;
  return (
    <div className="pass-through" style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 16, top: 14, display: "flex", gap: 10, alignItems: "center", pointerEvents: "auto" }}>
        <img src={kit.artPortrait} alt={kit.name} width={56} height={56} style={{ borderRadius: 6, border: "1px solid var(--gold)", objectFit: "cover" }} />
        <div style={{ minWidth: 220 }}>
          <div style={{ fontFamily: "var(--font-display)" }}>{kit.name}</div>
          <Bar value={hp} color="#9b2034" />
          <Bar value={sp} color="#5aa7e0" />
          {snap.player.shield > 0 && <div style={{ color: "var(--gold)" }}>護盾 {Math.round(snap.player.shield)}</div>}
        </div>
      </div>
      {snap.boss && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: "min(520px, 80vw)", pointerEvents: "none" }}>
          <div style={{ textAlign: "center", letterSpacing: "0.2em" }}>{snap.boss.name} · 第{snap.boss.phase}相</div>
          <Bar value={snap.boss.hp / snap.boss.maxHp} color="#3aa7d8" />
        </div>
      )}
      <button
        className="tb-btn"
        onClick={onGoObjective}
        style={{ position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)", letterSpacing: "0.12em" }}
      >
        {snap.objective}
      </button>
      {snap.encounterName && !snap.boss && (
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", color: "var(--gold)", pointerEvents: "none" }}>
          {snap.encounterName}
        </div>
      )}
      <button className="tb-btn ghost" style={{ position: "absolute", right: 16, top: 14 }} onClick={onPause}>
        暫停
      </button>
      <div style={{ position: "absolute", right: 16, bottom: 18, display: "flex", gap: 8, pointerEvents: "auto" }}>
        {snap.skills.map((s, i) => (
          <button key={s.name} className="tb-btn" disabled={s.cd > 0} onClick={() => onSkill(i as 0 | 1 | 2)} style={{ minWidth: 72 }}>
            {["Q", "R", "F"][i]}
            <div>{s.name}</div>
            {s.cd > 0 && <div>{s.cd.toFixed(1)}</div>}
          </button>
        ))}
      </div>
      <div className="mobile-only" style={{ position: "absolute", left: 18, bottom: 18, display: "flex", gap: 8, pointerEvents: "auto" }}>
        <button className="tb-btn" onClick={onAttack} style={{ minWidth: 64 }}>
          攻擊
        </button>
        <button className="tb-btn" onClick={onDodge} style={{ minWidth: 64 }}>
          迴避
        </button>
        {snap.interactInRange && (
          <button className="tb-btn" onClick={onInteract}>
            交談
          </button>
        )}
      </div>
      {snap.prompt && (
        <button
          className="tb-btn"
          onClick={onInteract}
          style={{ position: "absolute", left: "50%", bottom: 92, transform: "translateX(-50%)" }}
        >
          {snap.prompt.text}
        </button>
      )}
      {snap.ultCutIn > 0 && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", pointerEvents: "none" }}>
          <img
            src={kit.artPortrait}
            alt=""
            style={{ position: "absolute", left: 0, bottom: 0, height: "46%", opacity: 0.92, objectFit: "cover" }}
          />
          <div className="tb-title" style={{ position: "absolute", left: 24, bottom: 36, fontSize: 28 }}>
            {kit.skills[2].name}
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 8, background: "#1a2233", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
      <div style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height: "100%", background: color }} />
    </div>
  );
}
