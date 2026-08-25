import type { ReactNode } from "react";
import { RELICS } from "../../game/data/relics";
import type { Quality, RelicDef, RelicId, SettingsState, UnlocksState } from "../../game/types";

export function PauseScreen({ onResume, onSettings, onMenu }: { onResume: () => void; onSettings: () => void; onMenu: () => void }) {
  return (
    <Center>
      <h2 className="tb-title">暫停</h2>
      <Row>
        <button className="tb-btn" onClick={onResume}>
          繼續
        </button>
        <button className="tb-btn ghost" onClick={onSettings}>
          設定
        </button>
        <button className="tb-btn ghost" onClick={onMenu}>
          回主選單
        </button>
      </Row>
    </Center>
  );
}

export function RelicScreen({ choices, onPick }: { choices: RelicDef[]; onPick: (id: RelicId) => void }) {
  return (
    <Center>
      <h2 className="tb-title">山贈遺物</h2>
      <p style={{ color: "var(--muted)" }}>三選一。此物會改寫下一場戰鬥。</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 16 }}>
        {choices.map((r) => (
          <button key={r.id} className="tb-panel" style={{ padding: 14, color: "inherit", textAlign: "left" }} onClick={() => onPick(r.id)}>
            <strong className="tb-gold">{r.name}</strong>
            <p>{r.desc}</p>
            <p style={{ color: "var(--muted)" }}>{r.effect}</p>
          </button>
        ))}
      </div>
    </Center>
  );
}

export function ResultScreen({
  victory,
  time,
  kills,
  onRetry,
  onSelect,
  onUnlocks,
}: {
  victory: boolean;
  time: number;
  kills: number;
  onRetry: () => void;
  onSelect: () => void;
  onUnlocks: () => void;
}) {
  return (
    <Center>
      <h2 className="tb-title">{victory ? "山門暫解" : "刃折雨中"}</h2>
      <p>
        用時 {(time / 60).toFixed(1)} 分 斬殺 {kills}
      </p>
      <Row>
        <button className="tb-btn" onClick={onRetry}>
          再走一遭
        </button>
        <button className="tb-btn ghost" onClick={onSelect}>
          更換刃客
        </button>
        <button className="tb-btn ghost" onClick={onUnlocks}>
          解鎖
        </button>
      </Row>
    </Center>
  );
}

export function SettingsScreen({
  settings,
  onQuality,
  onVol,
  onBack,
}: {
  settings: SettingsState;
  onQuality: (q: Quality) => void;
  onVol: (bus: "music" | "sfx" | "ambience", v: number) => void;
  onBack: () => void;
}) {
  return (
    <Center>
      <h2 className="tb-title">設定</h2>
      <p>畫質</p>
      <Row>
        {(["high", "med", "low"] as Quality[]).map((q) => (
          <button key={q} className={settings.quality === q ? "tb-btn" : "tb-btn ghost"} onClick={() => onQuality(q)}>
            {q === "high" ? "高" : q === "med" ? "中" : "低"}
          </button>
        ))}
      </Row>
      {(["music", "sfx", "ambience"] as const).map((b) => (
        <label key={b} style={{ display: "block", marginTop: 10 }}>
          {b === "music" ? "音樂" : b === "sfx" ? "音效" : "環境"}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings[b]}
            onChange={(e) => onVol(b, Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </label>
      ))}
      <button className="tb-btn" style={{ marginTop: 16 }} onClick={onBack}>
        返回
      </button>
    </Center>
  );
}

export function UnlocksScreen({ unlocks, onBack }: { unlocks: UnlocksState; onBack: () => void }) {
  return (
    <Center>
      <h2 className="tb-title">解鎖</h2>
      <p>通關刃客：{unlocks.clearedKits.length ? unlocks.clearedKits.join("、") : "尚無"}</p>
      <p>見過結局：{unlocks.seenEnding ? "是" : "否"}</p>
      <p>見過遺物：{unlocks.relicsSeen.map((id) => RELICS[id].name).join("、") || "尚無"}</p>
      <p>最佳時間：{unlocks.bestTime ? `${(unlocks.bestTime / 60).toFixed(1)} 分` : "—"}</p>
      <button className="tb-btn" onClick={onBack}>
        返回
      </button>
    </Center>
  );
}

function Center({ children }: { children: ReactNode }) {
  return (
    <div className="tb-screen" style={{ alignItems: "center", justifyContent: "center" }}>
      <div className="tb-panel" style={{ width: "min(640px, 92vw)", padding: 24 }}>
        {children}
      </div>
    </div>
  );
}
function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>{children}</div>;
}
