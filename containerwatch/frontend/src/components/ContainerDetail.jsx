import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchHistory } from "../api.js";
import { formatBytes, timeLabel } from "../utils.js";

export default function ContainerDetail({ container, onBack, onAction, busy }) {
  const [history, setHistory] = useState([]);
  const id = container ? container.id : null;

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = () => fetchHistory(id).then((h) => alive && setHistory(h)).catch(() => {});
    load();
    const t = setInterval(load, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [id]);

  if (!container) {
    return (
      <main className="page">
        <a className="back" href="#top" onClick={(e) => { e.preventDefault(); onBack(); }}>← Back to Dashboard</a>
        <div className="card"><p className="muted">This container no longer exists.</p></div>
      </main>
    );
  }

  const running = container.state === "running";
  const chartData = history.map((s) => ({ time: timeLabel(s.t), CPU: +s.cpu.toFixed(2), Memory: +s.mem.toFixed(2) }));

  return (
    <main className="page">
      <a className="back" href="#top" onClick={(e) => { e.preventDefault(); onBack(); }}>← Back to Dashboard</a>
      <h1 className="detail-title">{container.name}</h1>
      <span className={`badge ${running ? "green" : "red"}`}>{container.state}</span>
      {container.highUsage && <span className="badge amber">High usage</span>}

      <div className="grid-2 detail-grid">
        <div>
          <section className="card">
            <h3>Container Details</h3>
            <dl>
              <dt>Container ID</dt><dd>{container.id}</dd>
              <dt>Image</dt><dd>{container.image}</dd>
              <dt>Status</dt><dd>{container.status}</dd>
              <dt>Ports</dt><dd>{container.ports || "none"}</dd>
              <dt>Processes</dt><dd>{container.pids}</dd>
              <dt>Memory</dt><dd>{formatBytes(container.memUsed)} of {formatBytes(container.memLimit)} ({container.memPercent.toFixed(1)}%)</dd>
              <dt>CPU</dt><dd>{container.cpuPercent.toFixed(2)}%</dd>
              <dt>Network in / out</dt><dd>{formatBytes(container.netRx)} / {formatBytes(container.netTx)}</dd>
              <dt>Disk read / write</dt><dd>{formatBytes(container.blockRead)} / {formatBytes(container.blockWrite)}</dd>
            </dl>
          </section>
          <section className="card">
            <h3>Manage Container</h3>
            <div className="actions left">
              {running ? (
                <>
                  <button className="btn outline red" disabled={busy} onClick={() => onAction(container.id, "stop")}>Stop</button>
                  <button className="btn outline blue" disabled={busy} onClick={() => onAction(container.id, "restart")}>Restart</button>
                </>
              ) : (
                <button className="btn outline green" disabled={busy} onClick={() => onAction(container.id, "start")}>Start</button>
              )}
            </div>
          </section>
        </div>

        <section className="card">
          <h3>Usage History <span className="muted small">(last {history.length} samples)</span></h3>
          {chartData.length < 2 ? (
            <p className="muted">{running ? "Collecting data… the chart appears after a few seconds." : "History is only recorded while the container is running."}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={30} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="CPU" stroke="#2563eb" dot={false} strokeWidth={2} isAnimationActive={false} />
                <Line type="monotone" dataKey="Memory" stroke="#7c3aed" dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </main>
  );
}
