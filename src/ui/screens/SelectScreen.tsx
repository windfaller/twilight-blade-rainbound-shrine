import { CHARACTER_LIST } from "../../game/data/characters";
import type { CharacterId } from "../../game/types";

export function SelectScreen({
  selected,
  onHover,
  onSelect,
  onConfirm,
  onBack,
}: {
  selected: CharacterId;
  onHover: (id: CharacterId) => void;
  onSelect: (id: CharacterId) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const kit = CHARACTER_LIST.find((c) => c.id === selected)!;
  return (
    <div className="tb-screen" style={{ padding: "4vh 4vw", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="tb-reading">CHOOSE YOUR BLADE</p>
          <h2 className="tb-title">選擇刃客</h2>
        </div>
        <button className="tb-btn ghost" onClick={onBack}>
          返回
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) minmax(280px, 360px)", gap: 20, flex: 1, minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, overflow: "auto" }}>
          {CHARACTER_LIST.map((c) => (
            <button
              key={c.id}
              className="tb-panel"
              onMouseEnter={() => onHover(c.id)}
              onClick={() => onSelect(c.id)}
              style={{
                padding: 0,
                overflow: "hidden",
                borderColor: selected === c.id ? "var(--gold)" : undefined,
                minHeight: 220,
              }}
            >
              <img src={c.artFull} alt={c.name} style={{ width: "100%", height: 180, objectFit: "cover", objectPosition: "top" }} />
              <div style={{ padding: "8px 10px" }}>
                <strong>
                  {c.name} / {c.nameEn}
                </strong>
                <div style={{ color: "var(--muted)" }}>{c.role}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="tb-panel" style={{ padding: 18, overflow: "auto" }}>
          <img src={kit.artFull} alt={kit.name} style={{ width: "100%", height: 260, objectFit: "contain", background: "#070a10" }} />
          <h3 className="tb-title" style={{ marginTop: 12 }}>
            {kit.name} {kit.nameEn}
          </h3>
          <p style={{ color: "var(--gold)" }}>
            {kit.origin} · {kit.weapon}
          </p>
          <p>{kit.blurb}</p>
          <p style={{ color: "var(--muted)" }}>
            定位 {kit.role} 難度 {kit.difficulty}
          </p>
          <ul>
            {kit.skills.map((s) => (
              <li key={s.id}>
                {s.key} {s.name} — {s.desc}
              </li>
            ))}
          </ul>
          <button className="tb-btn" onClick={onConfirm} style={{ width: "100%", marginTop: 12 }}>
            確認此刃
          </button>
        </div>
      </div>
    </div>
  );
}
