"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";

export default function BankIDPage() {
  const router = useRouter();
  const [code] = useState(() => generateCode());

  // Auto-advance after 8 seconds (real-feeling demo)
  useEffect(() => {
    const t = setTimeout(() => router.push("/address"), 8000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <>
      <Topbar title="BankID" />
      <div className="view items-center justify-center text-center gap-6">
        <div
          className="rounded-[28px] grid place-items-center"
          style={{
            width: 88,
            height: 88,
            background: "linear-gradient(135deg, #2156a8, #143670)",
          }}
        >
          <svg
            width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="1.6" strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="6" width="18" height="14" rx="2" />
            <path d="M7 10h10M7 14h6M7 18h4" />
          </svg>
        </div>

        <div>
          <h2 className="text-[22px] font-bold tracking-tight">
            Bekreft pålogging
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Åpne BankID-appen på telefonen og bekreft.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 max-w-[280px] w-full">
          <div
            className="text-center text-3xl tracking-[4px] text-green-500"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {code}
          </div>
          <p className="text-xs text-gray-500 mt-2">Engangskode</p>
        </div>

        <div className="spinner" />
        <p className="text-xs text-gray-500">Venter på bekreftelse…</p>

        <Link href="/address" className="contents">
          <Button variant="ghost" size="sm">
            ▸ Simuler innlogging
          </Button>
        </Link>
      </div>
    </>
  );
}

function generateCode(): string {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  const c = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  const d = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${a}${b}-${c}-${d}`;
}
