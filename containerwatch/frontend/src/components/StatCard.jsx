// One summary tile. The coloured left border comes from the `color` prop (see styles.css).
export default function StatCard({ value, label, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
