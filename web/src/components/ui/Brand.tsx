import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3 shrink-0" aria-label="Søknadsklar">
      <span
        className={`grid h-9 w-9 place-items-center rounded-[6px] border text-[13px] font-extrabold ${
          inverse
            ? "border-white/30 bg-white text-green-700"
            : "border-green-500 bg-green-500 text-white"
        }`}
      >
        SK
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-[15px] font-extrabold ${inverse ? "text-white" : "text-gray-900"}`}>
          SØKNADSKLAR
        </span>
        <span className={`mt-1 text-[10px] font-semibold ${inverse ? "text-white/65" : "text-gray-500"}`}>
          DIGITAL BYGGERÅDGIVNING
        </span>
      </span>
    </Link>
  );
}
