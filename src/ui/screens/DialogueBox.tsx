export function DialogueBox({
  speaker,
  portrait,
  text,
  last,
  onAdvance,
}: {
  speaker: string;
  portrait: string;
  text: string;
  last: boolean;
  onAdvance: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 16,
        display: "flex",
        gap: 12,
        alignItems: "stretch",
        pointerEvents: "auto",
      }}
    >
      <img src={portrait} alt={speaker} width={88} height={110} style={{ objectFit: "cover", border: "1px solid var(--gold)", borderRadius: 6 }} />
      <button className="tb-panel" onClick={onAdvance} style={{ flex: 1, textAlign: "left", padding: 16, color: "inherit" }}>
        <div className="tb-gold">{speaker}</div>
        <p style={{ margin: "8px 0 12px" }}>{text}</p>
        <span className="tb-btn" style={{ float: "right" }}>
          {last ? "續" : "續"}
        </span>
      </button>
    </div>
  );
}
