import { useState } from "react";
import { formatBytes, level } from "../utils.js";

function Meter({ pct }) {
  return (
    <div className="meter-cell">
      <div className="meter"><div className={`meter-fill ${level(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
      <span>{pct.toFixed(1)}%</span>
    </div>
  );
}

export default function ContainerTable({ containers, onOpen, onAction, busyId }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = containers.filter((c) => {
    const text = `${c.name} ${c.image} ${c.id}`.toLowerCase();
    if (search && !text.includes(search.toLowerCase())) return false;
    if (filter === "running") return c.state === "running";
    if (filter === "stopped") return c.state !== "running";
    if (filter === "high") return c.highUsage;
    return true;
  });

  return (
    <section className="card">
      <div className="toolbar">
        <input
          className="search"
          placeholder="Search by container name, image or id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="high">High usage</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Container</th><th>Image</th><th>Status</th><th>CPU</th><th>Memory</th>
              <th>Network (in / out)</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan="7" className="muted center">No containers match.</td></tr>
            )}
            {rows.map((c) => {
              const running = c.state === "running";
              return (
                <tr key={c.id}>
                  <td><button className="link" onClick={() => onOpen(c.id)}>{c.name}</button><div className="sub">{c.id}</div></td>
                  <td>{c.image}</td>
                  <td>
                    <span className={`badge ${running ? "green" : c.state === "paused" ? "amber" : "red"}`}>{c.state}</span>
                    {c.highUsage && <span className="badge amber">High usage</span>}
                  </td>
                  <td>{running ? <Meter pct={c.cpuPercent} /> : <span className="muted">—</span>}</td>
                  <td>
                    {running ? <><Meter pct={c.memPercent} /><div className="sub">{formatBytes(c.memUsed)} / {formatBytes(c.memLimit)}</div></> : <span className="muted">—</span>}
                  </td>
                  <td>{running ? `${formatBytes(c.netRx)} / ${formatBytes(c.netTx)}` : <span className="muted">—</span>}</td>
                  <td className="actions">
                    <button className="btn outline blue" onClick={() => onOpen(c.id)}>Details</button>
                    {running ? (
                      <button className="btn outline red" disabled={busyId === c.id} onClick={() => onAction(c.id, "stop")}>Stop</button>
                    ) : (
                      <button className="btn outline green" disabled={busyId === c.id} onClick={() => onAction(c.id, "start")}>Start</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
