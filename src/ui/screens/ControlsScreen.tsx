export function ControlsScreen({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  return (
    <div className="tb-screen" style={{ alignItems: "center", justifyContent: "center" }}>
      <div className="tb-panel" style={{ width: "min(680px, 92vw)", padding: 28 }}>
        <h2 className="tb-title">操作</h2>
        <ul style={{ lineHeight: 1.8, color: "var(--muted)" }}>
          <li>移動：WASD／左搖桿／點地尋路</li>
          <li>攻擊：滑鼠左鍵 迴避：右鍵或 Shift</li>
          <li>技能：Q / R / F（或 1 / 2 / 3）</li>
          <li>互動：E、空白鍵、提示或對話框、「續」皆可推進</li>
          <li>鏡頭：滾輪縮放；中鍵或雙指旋轉後回正</li>
          <li>暫停：Esc 除錯：F3</li>
        </ul>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="tb-btn" onClick={onPlay}>
            選擇刃客
          </button>
          <button className="tb-btn ghost" onClick={onBack}>
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
