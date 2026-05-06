import type { KjellerResult } from "@/lib/regulations/kjeller";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  });
  if (!res.ok) throw new Error(`PDF-generering feilet (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mittbygg-soknad-${result.input.propId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
