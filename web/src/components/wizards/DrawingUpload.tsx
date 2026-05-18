"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { uploadDrawings } from "@/lib/api/drawings";

const DRAWING_HINTS = ["Situasjonsplan", "Plantegning", "Fasadetegning", "Snitt"];

interface Props {
  onContinue: (sessionId: string | null) => void;
}

export function DrawingUpload({ onContinue }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const valid = Array.from(list).filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !existing.has(f.name))];
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
    setUploading(true);
    try {
      const result = await uploadDrawings(files);
      onContinue(result.session_id);
    } catch {
      onContinue(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Topbar title="Tegninger" back={false} />
      <div className="view">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Last opp tegninger</h2>
          <p className="text-sm text-gray-500 mt-1">
            Valgfritt, men øker sjansen for rask saksbehandling.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {DRAWING_HINTS.map((label) => (
            <span
              key={label}
              className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1.5 font-medium"
            >
              {label}
            </span>
          ))}
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
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
              <p className="font-semibold text-sm">Dra hit eller trykk for å velge</p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG — maks 10 MB per fil</p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
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
                onRemove={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
              />
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-2">
          <Button size="lg" full disabled={uploading} onClick={handleContinue}>
            {uploading ? (
              "Laster opp…"
            ) : files.length > 0 ? (
              <>Legg til i søknadspakke <ArrowRight /></>
            ) : (
              <>Fortsett uten tegninger <ArrowRight /></>
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
