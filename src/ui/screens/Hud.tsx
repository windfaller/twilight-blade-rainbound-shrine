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
      <div className="tb-hud-vitals">
        <img src={kit.artPortrait} alt={kit.name} width={56} height={56} />
        <div style={{ minWidth: 220 }}>
          <div className="tb-hud-name">{kit.name}</div>
          <Bar value={hp} color="#c43b2a" />
          <Bar value={sp} color="#7eb6d8" />
          {snap.player.shield > 0 && <div className="tb-gold">護盾 {Math.round(snap.player.shield)}</div>}
        </div>
      </div>
      {snap.boss && (
        <div className="tb-hud-boss">
          <div className="tb-hud-name" style={{ textAlign: "center" }}>
            {snap.boss.name} · 第{snap.boss.phase}相
          </div>
          <Bar value={snap.boss.hp / snap.boss.maxHp} color="#3aa7d8" />
        </div>
      )}
      <button className="tb-hud-obj" onClick={onGoObjective}>
        {snap.objective}
      </button>
      {snap.encounterName && !snap.boss && <div className="tb-hud-enc">{snap.encounterName}</div>}
      <button className="tb-btn ghost tb-hud-pause" onClick={onPause}>
        暫停
      </button>
      <div className="tb-hud-skills">
        {snap.skills.map((s, i) => (
          <button key={s.name} className="tb-hud-skill" disabled={s.cd > 0} onClick={() => onSkill(i as 0 | 1 | 2)}>
            <span className="tb-hud-key">{["Q", "R", "F"][i]}</span>
            <span>{s.name}</span>
            {s.cd > 0 && <span className="tb-hud-cd">{s.cd.toFixed(1)}</span>}
          </button>
        ))}
      </div>
      <div className="mobile-only tb-hud-mobile">
        <button className="tb-hud-skill" onClick={onAttack}>
          攻擊
        </button>
        <button className="tb-hud-skill" onClick={onDodge}>
          迴避
        </button>
        {snap.interactInRange && (
          <button className="tb-hud-skill" onClick={onInteract}>
            交談
          </button>
        )}
      </div>
      {snap.prompt && (
        <button className="tb-hud-obj tb-hud-prompt" onClick={onInteract}>
          {snap.prompt.text}
        </button>
      )}
      {snap.ultCutIn > 0 && (
        <div className="tb-hud-cutin">
          <img src={kit.artPortrait} alt="" />
          <div className="tb-title tb-hud-cutin-name">{kit.skills[2].name}</div>
        </div>
      )}
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="tb-hud-bar">
      <div style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height: "100%", background: color }} />
    </div>
  );
}
