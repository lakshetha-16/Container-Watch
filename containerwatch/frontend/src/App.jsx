import { useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import StatCard from "./components/StatCard.jsx";
import OverviewCharts from "./components/OverviewCharts.jsx";
import ContainerTable from "./components/ContainerTable.jsx";
import ContainerDetail from "./components/ContainerDetail.jsx";
import { fetchContainers, controlContainer } from "./api.js";
import { formatBytes } from "./utils.js";

const POLL_MS = 3000;

export default function App() {
  const [data, setData] = useState(null);       // latest response from /api/containers
  const [netError, setNetError] = useState(null);
  const [selectedId, setSelectedId] = useState(null); // null = dashboard, otherwise detail page
  const [flash, setFlash] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await fetchContainers());
      setNetError(null);
    } catch {
      setNetError("Cannot reach the backend. Start it with: npm run dev (port 5001).");
    }
  }, []);

  // Fetch now, then every 3 seconds. The cleanup stops the timer when the page closes.
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  async function handleAction(id, action) {
    setBusyId(id);
    try {
      const r = await controlContainer(id, action);
      setFlash({ type: "success", text: r.message });
    } catch (e) {
      setFlash({ type: "error", text: e.message });
    }
    setBusyId(null);
    load();
    setTimeout(() => setFlash(null), 4000);
  }

  const containers = data ? data.containers : [];
  const s = data ? data.summary : null;
  const selected = containers.find((c) => c.id === selectedId) || null;

  return (
    <>
      <Navbar mode={data && data.mode} dockerAvailable={data ? data.dockerAvailable : true} onHome={() => setSelectedId(null)} />

      {netError && <div className="banner error">{netError}</div>}
      {data && !data.dockerAvailable && <div className="banner error">{data.error}</div>}
      {data && data.mode === "demo" && <div className="banner info">Demo mode: these containers are simulated. Run without DEMO_MODE to monitor real Docker containers.</div>}
      {flash && <div className={`banner ${flash.type === "success" ? "success" : "error"}`}>{flash.text}</div>}

      {selectedId ? (
        <ContainerDetail
          container={selected}
          onBack={() => setSelectedId(null)}
          onAction={handleAction}
          busy={busyId === selectedId}
        />
      ) : (
        <main className="page" id="top">
          <div className="page-head">
            <h1>Container Monitoring Dashboard</h1>
            <span className="muted small">{data && data.updatedAt ? `Last updated ${new Date(data.updatedAt).toLocaleTimeString()}` : "Loading…"}</span>
          </div>

          <section className="stats">
            <StatCard value={s ? s.total : 0} label="Total Containers" color="dark" />
            <StatCard value={s ? s.running : 0} label="Running" color="green" />
            <StatCard value={s ? s.stopped : 0} label="Stopped" color="red" />
            <StatCard value={s ? s.highUsage : 0} label="High Usage" color="amber" />
            <StatCard value={s ? `${s.totalCpuPercent.toFixed(1)}%` : "0%"} label="Total CPU Load" color="blue" />
            <StatCard value={s ? formatBytes(s.totalMemUsed) : "0 B"} label="Memory Used" color="purple" />
          </section>

          <OverviewCharts containers={containers} />
          <ContainerTable containers={containers} onOpen={setSelectedId} onAction={handleAction} busyId={busyId} />
        </main>
      )}
    </>
  );
}
