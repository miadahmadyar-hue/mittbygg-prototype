import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Splash() {
  return (
    <>
      <div
        className="flex-1 flex flex-col justify-center px-5 py-10 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #fafaf8 0%, #ecf3ef 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(233,118,58,0.18), transparent)",
            top: -60,
            right: -100,
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            width: 280,
            height: 280,
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(10,79,60,0.10), transparent)",
            bottom: -80,
            left: -80,
          }}
        />

        <div
          className="mx-auto rounded-[28px] grid place-items-center mb-6"
          style={{
            width: 88,
            height: 88,
            background:
              "linear-gradient(135deg, #0a4f3c, #052f24 70%, #2a7a5e)",
            boxShadow:
              "0 12px 28px rgba(10,79,60,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <svg
            width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="1.6" strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <h1 className="text-[38px] leading-[1.05] font-bold tracking-[-0.025em] text-gray-900">
          Fra{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(120deg, #0a4f3c, #e9763a)",
            }}
          >
            idé
          </span>{" "}
          til{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(120deg, #0a4f3c, #e9763a)",
            }}
          >
            ferdigattest
          </span>
          .
        </h1>
        <p className="text-[17px] mt-4 mx-auto max-w-[320px] text-gray-700 leading-snug">
          MittBygg gir deg byggesøknader, tegninger og fagtjenester for hjemmet
          ditt — på minutter, ikke uker.
        </p>

        <div className="mt-9 flex flex-col gap-2.5 max-w-[340px] mx-auto w-full relative z-10">
          <Link href="/bankid" className="contents">
            <Button size="lg" full>
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <path d="M7 10h10M7 14h6M7 18h4" />
              </svg>
              Logg inn med BankID
            </Button>
          </Link>
          <Link href="/address" className="contents">
            <Button variant="ghost" full>
              Prøv demo (uten BankID)
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 text-center py-5">
        <p className="text-xs text-gray-500">
          Drives på sikker norsk infrastruktur · GDPR · Datalagring i EU
        </p>
      </div>
    </>
  );
}
