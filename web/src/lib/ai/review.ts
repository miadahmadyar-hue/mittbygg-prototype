import type { ArchitectAssessment } from "../api/aiArchitect";
import type { EngineerAssessment } from "../api/aiEngineer";

// Keep the handoff explicit: the engineer reviews the original evidence as well
// as the architect's observations, including when that first review failed.
export async function runAiReview(
  architectCall: () => Promise<ArchitectAssessment>,
  engineerCall: (architectContext: string) => Promise<EngineerAssessment>,
  fallback: { architect: ArchitectAssessment; engineer: EngineerAssessment },
  onEngineer: () => void,
) {
  const architect = await architectCall().catch(() => fallback.architect);
  onEngineer();
  const context = (architect.meta?.source === "openai" || architect.meta?.source === "claude")
    ? JSON.stringify({ summary: architect.summary, items: architect.items, anbefalinger: architect.anbefalinger })
    : "Arkitektvurderingen er ikke tilgjengelig. Gjør en selvstendig foreløpig gjennomgang.";
  const engineer = await engineerCall(context).catch(() => fallback.engineer);
  return { architect, engineer };
}
