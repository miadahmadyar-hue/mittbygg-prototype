export type IntakeValue = string | number | boolean | null;
export type IntakeAnswers = Record<string, IntakeValue>;
export type IntakeField = {
  key: string; label: [string, string]; type: string; nullable: boolean; manual: boolean; unit: string;
  choices: { value: string; label: [string, string] }[];
  min: number | null; max: number | null; exclusiveMin: boolean; minLength: number; maxLength: number;
  when?: { key: string; values: string[] };
};
export type IntakeUpdate = { key: string; value: IntakeValue; evidence: string };

export function activeFields(fields: IntakeField[], answers: IntakeAnswers) {
  return fields.filter(f => !f.when || f.when.values.includes(String(answers[f.when.key])));
}

export function validIntakeValue(field: IntakeField, value: unknown): boolean {
  if (value == null) return field.nullable;
  if (field.choices.length) return field.choices.some(c => c.value === value);
  if (field.type === "boolean") return typeof value === "boolean";
  if (["number", "integer"].includes(field.type)) return typeof value === "number" && Number.isFinite(value)
    && (field.type !== "integer" || Number.isInteger(value))
    && (field.min === null || (field.exclusiveMin ? value > field.min : value >= field.min))
    && (field.max === null || value <= field.max);
  return typeof value === "string" && value.trim().length >= field.minLength && value.length <= field.maxLength;
}

export function missingFields(fields: IntakeField[], answers: IntakeAnswers) {
  return activeFields(fields, answers).filter(f => !f.manual && !validIntakeValue(f, answers[f.key]));
}

export function applyIntakeUpdates(fields: IntakeField[], answers: IntakeAnswers, updates: IntakeUpdate[]) {
  const next = { ...answers };
  for (const update of updates) {
    const field = fields.find(f => f.key === update?.key && !f.manual);
    if (!field || typeof update.evidence !== "string" || !update.evidence.trim()) continue;
    if (update.value !== null && !validIntakeValue(field, update.value)) continue;
    next[field.key] = update.value;
    if (["room", "fra", "romtype"].includes(field.key) && answers[field.key] !== update.value) next.godkjent_bruk_bekreftet = false;
  }
  return next;
}
