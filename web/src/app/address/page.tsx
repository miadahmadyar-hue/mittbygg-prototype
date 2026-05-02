import { Topbar } from "@/components/ui/Topbar";

export default function AddressPage() {
  return (
    <>
      <Topbar title="" />
      <div className="view">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.025em] leading-[1.1]">
            Hvilken eiendom?
          </h1>
          <p className="mt-2 text-[17px] text-gray-700 leading-snug">
            Søk etter adresse, postnummer eller gnr/bnr.
          </p>
        </div>

        <div className="flex items-center bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-3.5 gap-3 mt-2 focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_var(--color-green-50)] transition">
          <span className="text-gray-400 shrink-0">
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="f.eks. Solbakken 12"
            className="flex-1 bg-transparent outline-none text-base"
          />
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mt-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Sprint 1 status
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Adressesøk er stub.</strong> Kobles mot{" "}
            <a
              href="https://ws.geonorge.no/adresser/v1/sok"
              className="text-green-500 underline"
              target="_blank"
              rel="noreferrer"
            >
              Kartverket Adresse-API
            </a>{" "}
            i Sprint 1. Eiendomsdata fra Geonorge / Matrikkel. Drawing-arkivet
            kobles mot Oslo PBE Saksinnsyn via FastAPI-proxy.
          </p>
        </div>
      </div>
    </>
  );
}
