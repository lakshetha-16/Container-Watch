import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function UsageBar({ title, data, dataKey, color }) {
  return (
    <div className="card chart-card">
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p className="muted">No running containers to chart.</p>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
            <YAxis unit="%" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function OverviewCharts({ containers }) {
  const running = containers.filter((c) => c.state === "running");
  const data = running.map((c) => ({
    name: c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name,
    cpu: c.cpuPercent,
    mem: c.memPercent,
  }));
  return (
    <section className="grid-2">
      <UsageBar title="CPU usage by container" data={data} dataKey="cpu" color="#2563eb" />
      <UsageBar title="Memory usage by container" data={data} dataKey="mem" color="#7c3aed" />
    </section>
  );
}
