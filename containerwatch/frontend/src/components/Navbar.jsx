export default function Navbar({ mode, dockerAvailable, onHome }) {
  let pill = { cls: "ok", text: "Docker connected" };
  if (mode === "demo") pill = { cls: "demo", text: "Demo data" };
  else if (!dockerAvailable) pill = { cls: "bad", text: "Docker offline" };

  return (
    <header className="navbar">
      <div className="nav-left">
        <span className="brand" onClick={onHome}>🐳 ContainerWatch</span>
        <a href="#top" onClick={(e) => { e.preventDefault(); onHome(); }}>Dashboard</a>
      </div>
      <div className="nav-right">
        <span className="live"><span className="dot" /> Live · refreshes every 3 s</span>
        <span className={`pill ${pill.cls}`}>{pill.text}</span>
      </div>
    </header>
  );
}
