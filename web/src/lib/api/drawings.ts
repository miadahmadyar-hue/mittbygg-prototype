const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface DrawingUploadResult {
  session_id: string;
  files: { name: string; size: number }[];
}

export async function uploadDrawings(files: File[]): Promise<DrawingUploadResult> {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await fetch(`${API_URL}/api/drawings/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error("upload failed");
  return res.json();
}
