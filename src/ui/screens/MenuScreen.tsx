export function MenuScreen({
  onStart,
  onControls,
  onSettings,
  onUnlocks,
}: {
  onStart: () => void;
  onControls: () => void;
  onSettings: () => void;
  onUnlocks: () => void;
}) {
  return (
    <div className="tb-screen" style={{ justifyContent: "flex-end", padding: "8vh 8vw 10vh" }}>
      <div>
        <p className="tb-reading">TWILIGHT BLADE · RAINBOUND SHRINE</p>
        <h1 className="tb-masthead" style={{ fontSize: "clamp(3.2rem, 9vw, 6.4rem)" }}>
          暮刃紀行
        </h1>
        <div className="tb-rule" />
        <p style={{ letterSpacing: "0.42em", color: "var(--amber)", margin: 0 }}>雨鎖山門</p>
        <p style={{ maxWidth: 520, color: "var(--muted)", marginTop: 18, lineHeight: 1.75 }}>
          夜雨未歇。守燈人仍守著山門。選一位刃客，走完祭壇、番大將，與雨蝕武者的兩重殘魄。
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
          <button className="tb-btn" onClick={onStart}>
            踏入山門
          </button>
          <button className="tb-btn ghost" onClick={onControls}>
            操作說明
          </button>
          <button className="tb-btn ghost" onClick={onSettings}>
            設定
          </button>
          <button className="tb-btn ghost" onClick={onUnlocks}>
            解鎖
          </button>
        </div>
      </div>
    </div>
  );
}
