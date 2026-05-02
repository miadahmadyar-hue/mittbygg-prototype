export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1 px-5 pb-3 bg-white">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-1 rounded-full transition-colors ${
            i <= step ? "bg-green-500" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}
