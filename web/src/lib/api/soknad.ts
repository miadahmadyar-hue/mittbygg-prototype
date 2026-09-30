import { sessionFetch } from "./session";
import type { KjellerResult } from "@/lib/regulations/kjeller";
import type { TiltakResult } from "@/lib/api/evaluate";
import { saveDocument, downloadBlob } from "@/lib/documents";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function _triggerDownload(blob: Blob, filename: string) {
  if (blob.size === 0 || !(await blob.slice(0, 5).text()).startsWith("%PDF-")) throw new Error("Invalid PDF response");
  await saveDocument(blob, filename);
  downloadBlob(blob, filename);
}

export async function downloadKjellerSoknad(
  result: KjellerResult,
  address: string,
  gnr: number,
  bnr: number,
  kommune: string,
): Promise<void> {
  const res = await sessionFetch(`${API_URL}/api/soknad/kjeller`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, address, gnr, bnr, kommune }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`PDF-generering feilet (${res.status})`);
  await _triggerDownload(await res.blob(), `soknadsklar-${result.input.propId}.pdf`);
}

export async function downloadTiltakSoknad(
  slug: string,
  result: TiltakResult,
  address: string,
  gnr: number,
  bnr: number,
  kommune: string,
  architect?: Record<string, unknown> | null,
  engineer?: Record<string, unknown> | null,
): Promise<void> {
  const res = await sessionFetch(`${API_URL}/api/soknad/tiltak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, result, address, gnr, bnr, kommune, architect, engineer }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`PDF-generering feilet (${res.status})`);
  await _triggerDownload(await res.blob(), `soknadsklar-${slug}.pdf`);
}
