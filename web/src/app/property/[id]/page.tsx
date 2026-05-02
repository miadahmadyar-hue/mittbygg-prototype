import { notFound } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { findAddress } from "@/lib/data/addresses";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const property = findAddress(id);
  if (!property) notFound();

  const p = property;
  const sakerCount = p.bygg.tidligereSaker.length;
  const tegningerCount = p.bygg.tegninger?.length ?? 0;

  return (
    <>
      <Topbar title="Min eiendom" />
      <div className="view">
        <div
          className="text-white p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0a4f3c, #052f24)",
          }}
        >
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              top: -50,
              right: -50,
            }}
          />
          <h2 className="text-[22px] font-bold tracking-tight relative">
            {p.street}
          </h2>
          <p className="text-white/75 mt-1 relative">
            {p.postal} {p.city}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-5 relative">
            <Stat num={p.bygg.BRA} lbl="m² BRA" />
            <Stat num={p.bygg.byggeAar} lbl="Byggeår" />
            <Stat
              num={`${p.bygg.etasjer}${p.bygg.kjeller ? "+K" : ""}`}
              lbl="Etasjer"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl">
          <KV k="Gnr/Bnr" v={`${p.matrikkel.gnr}/${p.matrikkel.bnr}`} />
          <KV k="Kommune" v={p.matrikkel.kommune} last />
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Skeleton-status
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            Eiendoms-dashboardet er under porting fra prototypen. Rom for{" "}
            <strong>{sakerCount}</strong> tidligere sak
            {sakerCount === 1 ? "" : "er"}, <strong>{tegningerCount}</strong>{" "}
            tegning{tegningerCount === 1 ? "" : "er"} på arkiv,
            byggegrenser, reguleringsplan, og tiltak-velger kommer i Sprint 1.
          </p>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            Klikk-prototypen er fortsatt tilgjengelig på{" "}
            <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
              ../index.html
            </code>{" "}
            og inneholder den fulle flyten.
          </p>
        </div>
      </div>
    </>
  );
}

function Stat({ num, lbl }: { num: string | number; lbl: string }) {
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight">{num}</div>
      <div className="text-xs opacity-70 mt-0.5">{lbl}</div>
    </div>
  );
}

function KV({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div
      className={`flex justify-between px-5 py-3 text-sm ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <span className="text-gray-500">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
