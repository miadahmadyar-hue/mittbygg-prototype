"""
Fjern-vegg rule engine + bjelkedimensjonering.
Python port of web/src/lib/regulations/vegg.ts,
which mirrors norsk_arkitekt_ai/core/structural.py.
"""
import math
from models import VeggInput, VeggResult, Finding, Tiltak, Lempning, Bjelke

STD_HEIGHTS = [180, 225, 270, 315, 360, 405, 450, 495, 540, 630, 720]


def evaluate_vegg(inp: VeggInput) -> VeggResult:
    L = inp.spennvidde / 1000          # metres
    qd = inp.last * 1.5                # design load kN/m
    M = (qd * L * L) / 8              # kNm
    fm = 30                            # MPa — Limtre GL30c
    b = 90 if L < 4 else (115 if L < 6 else 140)
    h_min = math.sqrt((6 * M * 1e6) / (b * fm))
    h = next((v for v in STD_HEIGHTS if v >= h_min), 720)

    cap_moment = (b * h * h * fm) / 6 / 1e6

    findings: list[Finding] = [
        Finding(
            type="fail",
            t="Krever ansvarsrett (PBL § 20-3)",
            d="Endring av bærekonstruksjon utløser alltid søknad med ansvarsrett. "
              "Ansvarlig prosjekterende konstruksjon (PRO-RIB) må signere endelig dimensjon.",
            ref="PBL § 20-3",
        ),
        Finding(
            type="warn",
            t="Brannmotstand på bjelken må sjekkes",
            d="Bjelken må ha R 30 (BKL1) eller R 60 (BKL2). Limtre kan kreve ekstra tiltak.",
            ref="TEK17 § 11-12",
        ),
        Finding(
            type="ok",
            t=f"Foreslått bjelke: {b}×{h} mm Limtre GL30c",
            d=f"Spennvidde {inp.spennvidde} mm, last {inp.last} kN/m. "
              f"Kapasitetsmoment {cap_moment:.1f} kNm > krav {M:.1f} kNm.",
            ref="NS-EN 1995",
        ),
    ]

    tiltak: list[Tiltak] = [
        Tiltak(
            name=f"Limtre-bjelke {b}×{h} mm",
            desc="Limtre GL30c, ferdig overflatebehandlet. Leveres med dragar-sko (varmgalv. stål).",
            kostnad=round(L * 4500),
        ),
        Tiltak(
            name="Riving + bortkjøring av eksisterende vegg",
            desc="Container, støvavskjerming, midlertidig avstiving under riveperioden.",
            kostnad=25_000,
        ),
        Tiltak(
            name="Konstruksjonsberegning (RIB)",
            desc="Eurokode-beregning iht. NS-EN 1995, gjennomboyning < L/300, brannmotstand R 30 minimum.",
            kostnad=15_000,
        ),
        Tiltak(
            name="Innkledning av bjelke (estetikk + brann)",
            desc="Gips-innkledning eller eksponert. Brannmaling om eksponert.",
            kostnad=12_000,
        ),
    ]

    total_kostnad = sum(t.kostnad for t in tiltak)

    return VeggResult(
        status="amber",
        statusText="Klar — krever arkitekt-KS",
        statusDesc="Tiltaket er gjennomførbart, men må gå gjennom konstruksjonsfag (PRO-RIB) før søknad sendes.",
        findings=findings,
        tiltak=tiltak,
        lempninger=[],
        soknadstype="PBL § 20-3 (med ansvarsrett)",
        ansvarsrett=True,
        tiltaksklasse=1,
        totalKostnad=total_kostnad,
        bjelke=Bjelke(b=b, h=h, type="Limtre GL30c", spennvidde=inp.spennvidde, last=inp.last),
        input=inp,
    )
