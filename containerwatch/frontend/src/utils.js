export function formatBytes(n) {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${i === 0 || n >= 100 ? n.toFixed(0) : n.toFixed(1)} ${units[i]}`;
}

// Colour level for a usage percentage: ok < 60, warn < 80, danger >= 80
export function level(pct) {
  if (pct >= 80) return "danger";
  if (pct >= 60) return "warn";
  return "ok";
}

export function timeLabel(ms) {
  return new Date(ms).toLocaleTimeString([], { hour12: false });
}
