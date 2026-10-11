"use client";
import { useDraftState } from "@/lib/projects";
import { Button } from "@/components/ui/Button";

export function ChatBrief({ notes, onUse }: { notes: string; onUse: (notes: string) => void }) {
  const [brief] = useDraftState("chatBrief", { notes: "" });
  if (!brief.notes || notes.includes(brief.notes)) return null;
  const combined = notes ? `${notes}\n\nFra prosjektsamtalen:\n${brief.notes}` : brief.notes;
  return <section className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-2">
    <h2 className="font-semibold">Beskrivelsen fra samtalen</h2>
    <p className="text-sm whitespace-pre-wrap break-words">{brief.notes}</p>
    {combined.length <= 2000 ? <Button variant="secondary" full onClick={() => onUse(combined)}>Ta med beskrivelsen i saken</Button>
      : <p className="text-sm">Du har allerede en beskrivelse. Kopier de viktige opplysningene inn i feltet nedenfor (maks. 2000 tegn).</p>}
    <p className="text-xs text-gray-600">Opplysninger i beskrivelsesfeltet følger med når du sender en forespørsel eller laster ned saksunderlaget.</p>
  </section>;
}
