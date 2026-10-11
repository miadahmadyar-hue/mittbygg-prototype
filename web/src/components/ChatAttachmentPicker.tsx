"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/context";
import { uploadDrawings } from "@/lib/api/drawings";
import { attachmentError, type ChatAttachments } from "@/lib/ai/attachments";
import { Button } from "./ui/Button";

export function ChatAttachmentPicker({ value, onChange, disabled, onBusy }: { value: ChatAttachments | null; onChange: (value: ChatAttachments | null) => void; disabled: boolean; onBusy: (busy: boolean) => void }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => () => active.current?.abort(), []);
  async function attach(list: FileList | null) {
    if (!list?.length || active.current) return;
    const files = Array.from(list);
    const invalid = attachmentError(files);
    if (invalid) {
      setError(t("Velg inntil 6 PDF-, PNG- eller JPG-filer. Maks 10 MB per fil og 20 MB totalt. Tomme filer kan ikke brukes.", "Choose up to 6 PDF, PNG or JPG files. Maximum 10 MB per file and 20 MB total. Empty files cannot be used."));
      return;
    }
    const controller = new AbortController(); active.current = controller;
    setUploading(true); onBusy(true); setError("");
    try {
      const result = await uploadDrawings(files, controller.signal);
      if (controller.signal.aborted) return;
      onChange({ session_id: result.session_id, files: result.files });
      if (result.rejected.length) setError(t("Disse filene ble avvist: ", "These files were rejected: ") + result.rejected.map(f => f.name).join(", "));
    } catch {
      if (!controller.signal.aborted) setError(t("Opplastingen mislyktes. Velg filene på nytt for å prøve igjen. Tidligere vedlegg er beholdt.", "Upload failed. Select the files again to retry. Previous attachments are unchanged."));
    } finally {
      if (!controller.signal.aborted) { setUploading(false); onBusy(false); }
      if (active.current === controller) active.current = null;
      if (input.current) input.current.value = "";
    }
  }
  return <div className="rounded-lg border border-gray-200 p-3 space-y-2">
    <input ref={input} type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" aria-label={t("Velg vedlegg", "Choose attachments")} onChange={e => { void attach(e.target.files); e.target.value = ""; }} />
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="secondary" disabled={disabled || uploading} onClick={() => input.current?.click()}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 11-8 8a6 6 0 0 1-8-8l9-9a4 4 0 0 1 6 6l-9 9a2 2 0 0 1-3-3l8-8" /></svg>
        {uploading ? t("Laster opp …", "Uploading …") : value ? t("Bytt vedlegg", "Replace attachments") : t("Legg ved filer", "Attach files")}
      </Button>
      {value && <Button type="button" variant="ghost" size="sm" disabled={disabled || uploading} onClick={() => { onChange(null); setError(""); }}>{t("Fjern vedlegg fra samtalen", "Remove attachments from chat")}</Button>}
    </div>
    <p className="text-xs text-gray-500">{t("PDF, PNG eller JPG · inntil 6 filer · 10 MB per fil · 20 MB totalt. Filer lastes opp når du velger dem og deles med AI når du sender meldingen.", "PDF, PNG or JPG · up to 6 files · 10 MB each · 20 MB total. Files upload when selected and are shared with AI when you send your message.")}</p>
    {value && <><ul className="text-sm space-y-1">{value.files.map((file, i) => <li key={i} className="break-words">{file.name} <span className="text-gray-500">({Math.ceil(file.size / 1024)} KB)</span></li>)}</ul>
      <p className="text-xs text-gray-500">{t("Vedleggene følger med til veiviseren i denne økten. Ved utløpt økt eller omlasting kan du måtte laste opp igjen. Fjerning trekker ikke tilbake tidligere AI-gjennomgang.", "Attachments carry into the wizard for this session. After a reload or session expiry, you may need to upload again. Removing files does not undo earlier AI processing.")}</p></>}
    {uploading && <p role="status" className="text-sm">{t("Laster opp vedlegg …", "Uploading attachments …")}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
