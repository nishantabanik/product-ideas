export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-label="Loading">
      <div className="skel" style={{ height: 34, width: 240, marginBottom: 10 }} />
      <div className="skel" style={{ height: 16, width: 380, marginBottom: 26 }} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 112, borderRadius: 16 }} />)}</div>
      <div className="skel" style={{ height: 360, borderRadius: 16 }} />
    </div>
  );
}
