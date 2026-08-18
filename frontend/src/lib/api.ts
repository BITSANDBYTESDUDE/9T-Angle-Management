export type ApiResponse<T> = { success: boolean; message: string; data: T; meta?: { page: number; limit: number; total: number; pages: number; unread?: number } };
export class ApiError extends Error { constructor(message: string, public status: number, public details?: unknown) { super(message); } }
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", cache: "no-store", headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...options.headers } });
  const payload = await response.json().catch(() => ({ success: false, message: "The server returned an unreadable response." }));
  if (!response.ok) throw new ApiError(payload.message || "Request failed.", response.status, payload.details);
  return payload;
}
export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const put = <T>(path: string, body: unknown) => api<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) });
export const remove = <T>(path: string) => api<T>(path, { method: "DELETE" });
export async function download(path: string) { const response = await fetch(`${API_URL}${path}`, { credentials: "include" }); if (!response.ok) { const p = await response.json().catch(() => ({})); throw new ApiError(p.message || "Export failed.", response.status); } const blob = await response.blob(); const disposition = response.headers.get("content-disposition") || ""; const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "report"; const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
