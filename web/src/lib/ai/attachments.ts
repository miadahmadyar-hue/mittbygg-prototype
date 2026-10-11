export type ChatAttachments = { session_id: string; files: { name: string; size: number }[] };

export function attachmentError(files: { name: string; size: number }[]): "type" | "count" | "size" | "total" | null {
  if (files.length > 6) return "count";
  if (files.some(f => !/\.(pdf|png|jpe?g)$/i.test(f.name))) return "type";
  if (files.some(f => f.size === 0 || f.size > 10 * 1024 * 1024)) return "size";
  if (files.reduce((sum, f) => sum + f.size, 0) > 20 * 1024 * 1024) return "total";
  return null;
}
