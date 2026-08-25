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
    <div className="tb-screen tb-menu">
      <div className="tb-spine">
        <p className="tb-reading">TWILIGHT BLADE · RAINBOUND SHRINE</p>
        <h1 className="tb-masthead">暮刃紀行</h1>
        <p className="tb-chapter">雨鎖山門</p>
        <p className="tb-lede">
          夜雨未歇。守燈人仍守著山門。選一位刃客，走完祭壇、番大將，與雨蝕武者的兩重殘魄。
        </p>
        <div className="tb-menu-actions">
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
      <p className="tb-hint">WASD 移動 · 滑鼠點地 · Q R F 技 · 空白迴避</p>
    </div>
  );
}
