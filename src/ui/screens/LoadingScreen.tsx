import type { LoadingState } from "../../game/types";

export function LoadingScreen({ loading, onRetry }: { loading: LoadingState; onRetry: () => void }) {
  return (
    <div className="tb-screen" style={{ justifyContent: "center", alignItems: "center", pointerEvents: "auto" }}>
      <div className="tb-ember" aria-hidden />
      <p className="tb-reading">TWILIGHT BLADE</p>
      <h1 className="tb-masthead" style={{ fontSize: "clamp(2.4rem, 7vw, 4.4rem)" }}>
        暮刃紀行
      </h1>
      <div className="tb-rule" />
      <p className="tb-amber" style={{ letterSpacing: "0.36em", margin: 0 }}>
        正在點亮山門
      </p>
      <div style={{ width: "min(420px, 80vw)", marginTop: 28 }}>
        <div style={{ height: 3, background: "#151b24", overflow: "hidden", border: "1px solid rgba(231,184,104,0.28)" }}>
          <div style={{ width: `${Math.round(loading.progress * 100)}%`, height: "100%", background: "linear-gradient(90deg,#e7b868,#c43b2a)" }} />
        </div>
        <p style={{ color: "var(--muted)", marginTop: 10 }}>{loading.label}</p>
        {loading.error && (
          <>
            <p style={{ color: "#ff8a8a" }}>{loading.error}</p>
            <button className="tb-btn" onClick={onRetry}>
              重試
            </button>
          </>
        )}
      </div>
    </div>
  );
}
