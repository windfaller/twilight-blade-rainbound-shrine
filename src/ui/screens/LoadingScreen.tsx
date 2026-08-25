import type { LoadingState } from "../../game/types";

export function LoadingScreen({ loading, onRetry }: { loading: LoadingState; onRetry: () => void }) {
  return (
    <div className="tb-screen" style={{ justifyContent: "center", alignItems: "center", pointerEvents: "auto" }}>
      <h1 className="tb-title" style={{ fontSize: "1.7rem" }}>
        暮刃紀行
      </h1>
      <p className="tb-gold" style={{ letterSpacing: "0.28em" }}>
        雨鎖山門
      </p>
      <div style={{ width: "min(420px, 80vw)", marginTop: 28 }}>
        <div style={{ height: 8, background: "#1a2233", borderRadius: 99, overflow: "hidden", border: "1px solid rgba(224,180,90,0.25)" }}>
          <div style={{ width: `${Math.round(loading.progress * 100)}%`, height: "100%", background: "linear-gradient(90deg,#e0b45a,#9b2034)" }} />
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
