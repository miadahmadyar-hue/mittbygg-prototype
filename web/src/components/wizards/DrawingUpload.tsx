"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { uploadDrawings } from "@/lib/api/drawings";
import { useT } from "@/lib/i18n/context";

const DRAWING_HINTS: [string, string][] = [
  ["Situasjonsplan", "Site plan"],
  ["Plantegning", "Floor plan"],
  ["Fasadetegning", "Facade drawing"],
  ["Snitt", "Section"],
];

interface Props {
  hints?: string[];
  onContinue: (sessionId: string | null) => void;
  onBack: () => void;
}

export function DrawingUpload({ onContinue, onBack, hints }: Props) {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState<{ session: string; names: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const valid = Array.from(list).filter(
      (f) => ["image/jpeg", "image/png", "application/pdf"].includes(f.type) && f.size <= 10 * 1024 * 1024
    );
    setUploaded(null);
    setError(valid.length !== list.length ? "Noen filer ble avvist. Velg PDF, PNG eller JPG, maks 10 MB per fil." : "");
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const next = [...prev, ...valid.filter((f) => !existing.has(f.name))];
      if (next.length > 6) setError("Du kan laste opp maksimalt 6 filer. De øvrige filene er ikke lagt til.");
      return next.slice(0, 6);
    });
  }, []);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleContinue = async () => {
    if (files.length === 0) {
      onContinue(null);
      return;
    }
    if (files.reduce((total, file) => total + file.size, 0) > 20 * 1024 * 1024) {
      setError(t("Filene er større enn 20 MB til sammen. Fjern eller komprimer noen filer.", "Files exceed 20 MB in total. Remove or compress some files."));
      return;
    }
    setUploading(true);
    setError("");
    try {
      const result = await uploadDrawings(files);
      if (result.rejected?.length) {
        setUploaded({ session: result.session_id, names: result.files.map((f) => f.name) });
        setError(`Avvist: ${result.rejected.map((f) => `${f.name} (${f.reason})`).join(", ")}. Velg filer på nytt eller fortsett med de godkjente.`);
        return;
      }
      onContinue(result.session_id);
    } catch {
      setError("Opplastingen mislyktes. Filene er beholdt her. Prøv igjen eller fjern filene for å fortsette uten tegninger.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Topbar title={t("Tegninger", "Drawings")} onBack={onBack} />
      <div className="view">
        {error && <p role="alert" className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">{error}</p>}
        {uploaded && <div className="panel p-4"><p>{t("Lastet opp:", "Uploaded:")} {uploaded.names.join(", ")}</p><Button onClick={() => onContinue(uploaded.session)}>{t("Fortsett med disse filene", "Continue with these files")}</Button></div>}
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">{t("Last opp tegninger", "Upload drawings")}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("Du kan hoppe over dette for en foreløpig vurdering. Kommunen kan kreve tegninger før innsending. Begge AI-rollene kan lese PDF, PNG og JPG. Maks 6 filer, 10 MB per fil og 20 MB totalt. PDF-er må være uten passord.", "You can skip this for a preliminary assessment. The municipality may require drawings before submission. Both AI roles can read PDF, PNG and JPG. Maximum 6 files, 10 MB each and 20 MB total. PDFs must not be password protected.")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(hints ? hints.map(text => [text, text]) : DRAWING_HINTS).map(([no, en]) => (
            <span
              key={no}
              className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1.5 font-medium"
            >
              {t(no, en)}
            </span>
          ))}
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-green-400 bg-green-50"
              : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 grid place-items-center">
              <UploadIcon />
            </div>
            <div>
              <p className="font-semibold text-sm">{t("Dra hit eller trykk for å velge", "Drag here or tap to choose")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("PDF, PNG, JPG — maks 10 MB per fil", "PDF, PNG, JPG — max 10 MB per file")}</p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,.pdf"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {files.map((f, i) => (
              <FileRow
                key={f.name}
                file={f}
                last={i === files.length - 1}
                onRemove={() => { setUploaded(null); setFiles((prev) => prev.filter((x) => x.name !== f.name)); }}
              />
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-2">
          <Button size="lg" full disabled={uploading} onClick={handleContinue}>
            {uploading ? (
              t("Laster opp…", "Uploading…")
            ) : files.length > 0 ? (
              <>{t("Fortsett til AI-gjennomgang", "Continue to AI review")} <ArrowRight /></>
            ) : (
              <>{t("Fortsett uten tegninger", "Continue without drawings")} <ArrowRight /></>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

function FileRow({
  file,
  last,
  onRemove,
}: {
  file: File;
  last: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${last ? "" : "border-b border-gray-100"}`}
    >
      <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
        {file.type === "application/pdf" ? <PdfIcon /> : <ImageIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{file.name}</p>
        <p className="text-xs text-gray-400">{Math.round(file.size / 1024)} KB</p>
      </div>
      <button
        onClick={onRemove}
        aria-label={`Fjern ${file.name}`}
        className="text-gray-400 hover:text-red-500 transition-colors p-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
