// All calls to the Express backend live here, so components stay simple.
const BASE = import.meta.env.VITE_API_URL || ""; // empty = same origin (Vite proxy / built app)

async function request(path, options) {
  const res = await fetch(BASE + path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const fetchContainers = () => request("/api/containers");
export const fetchHistory = (id) => request(`/api/containers/${encodeURIComponent(id)}/history`);
export const controlContainer = (id, action) =>
  request(`/api/containers/${encodeURIComponent(id)}/${action}`, { method: "POST" });
