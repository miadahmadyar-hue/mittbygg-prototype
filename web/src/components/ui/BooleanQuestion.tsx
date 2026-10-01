"use client";

export function BooleanQuestion({ title, description, value, onChange }: {
  title: string; description?: string; value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
}) {
  return <fieldset className="panel p-4">
    <legend className="text-sm font-semibold px-1">{title}</legend>
    {description && <p className="text-sm text-gray-500 mb-3">{description}</p>}
    <div className="grid grid-cols-3 gap-2">
      {([true, false, null] as const).map((option, i) => <button key={i} type="button" aria-pressed={(value ?? null) === option} onClick={() => onChange(option)}
        className={`rounded-lg border px-2 py-3 text-sm transition ${(value ?? null) === option ? "border-green-600 bg-green-50 font-semibold text-green-900" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
        {["Ja", "Nei", "Vet ikke"][i]}
      </button>)}
    </div>
  </fieldset>;
}
