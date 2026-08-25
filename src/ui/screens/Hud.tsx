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
    <div className="pass-through tb-hud" style={{ position: "absolute", inset: 0 }}>
      <div className="tb-hud-vitals">
        <div className="tb-hud-diamond">
          <img src={kit.artPortrait} alt={kit.name} />
        </div>
        <div>
          <div className="tb-hud-name">{kit.name}</div>
          <div className="tb-hud-bar tb-hud-hp">
            <div style={{ width: `${Math.round(Math.max(0, Math.min(1, hp)) * 100)}%` }} />
          </div>
          <div className="tb-hud-bar tb-hud-sp">
            <div style={{ width: `${Math.round(Math.max(0, Math.min(1, sp)) * 100)}%` }} />
          </div>
          {snap.player.shield > 0 && <div className="tb-gold">護盾 {Math.round(snap.player.shield)}</div>}
        </div>
      </div>
      <div className="tb-hud-place">
        <div className="tb-hud-weather">
          {snap.weather} · {snap.place}
        </div>
        <div className="tb-hud-locale">{snap.place}</div>
      </div>
      {snap.boss && (
        <div className="tb-hud-boss">
          <div className="tb-hud-name" style={{ textAlign: "center" }}>
            {snap.boss.name} · 第{snap.boss.phase}相
          </div>
          <div className="tb-hud-bar tb-hud-hp">
            <div style={{ width: `${Math.round(Math.max(0, Math.min(1, snap.boss.hp / snap.boss.maxHp)) * 100)}%` }} />
          </div>
        </div>
      )}
      <button className="tb-hud-obj" onClick={onGoObjective}>
        <span className="tb-hud-gem" aria-hidden />
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
