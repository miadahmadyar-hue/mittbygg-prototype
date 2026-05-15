import type { KjellerResult } from "@/lib/regulations/kjeller";
import type { TiltakResult } from "@/lib/api/evaluate";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function _triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadKjellerSoknad(
  result: KjellerResult,
  address: string,
  gnr: number,
  bnr: number,
  kommune: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/soknad/kjeller`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, address, gnr, bnr, kommune }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`PDF-generering feilet (${res.status})`);
  await _triggerDownload(await res.blob(), `mittbygg-soknad-${result.input.propId}.pdf`);
}

export async function downloadTiltakSoknad(
  slug: string,
  result: TiltakResult,
  address: string,
  gnr: number,
  bnr: number,
  kommune: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/soknad/tiltak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, result, address, gnr, bnr, kommune }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`PDF-generering feilet (${res.status})`);
  await _triggerDownload(await res.blob(), `mittbygg-soknad-${slug}.pdf`);
}
