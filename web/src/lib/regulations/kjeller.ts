/**
 * Kjellerbruksendring rule engine — TypeScript port of evaluateKjeller()
 * from prototype/index.html. Mirrors norsk_arkitekt_ai/regulations/
 * kjeller_wizard.py logic.
 *
 * STAGE 1 NOTE: this code will move to the FastAPI backend
 * (calling the Python regelmotor directly). Keeping it client-side
 * for the demo so we don't need a server to do regulatory math.
 */

import {
  KJELLER_BRUK, type KjellerBrukId, getKjellerRooms,
} from "@/lib/data/kjellerBruk";

export interface Finding {
  type: "ok" | "warn" | "fail";
  t: string;
  d: string;
  ref: string;
}

export interface Tiltak {
  name: string;
  desc: string;
  kostnad: number;
}

export interface Lempning {
  regel: string;
  tekst: string;
}

export interface KjellerInput {
  propId: string;
  byggeAar: number;
  room: string;
  ny_bruk: KjellerBrukId;
  radon: number | null;
  drenering: boolean;
  balansert_vent: boolean;
  bra?: number | null;
  etasjer?: number | null;
}

export interface KjellerResult {
  status: "green" | "amber" | "red";
  statusText: string;
  statusDesc: string;
  findings: Finding[];
  tiltak: Tiltak[];
  lempninger: Lempning[];
  eldre: boolean;
  soknadstype: string;
  ansvarsrett: boolean;
  tiltaksklasse: 1 | 2;
  totalKostnad: number;
  bjelke?: undefined;
  input: KjellerInput;
}

export function evaluateKjeller(input: KjellerInput): KjellerResult {
  const krav = KJELLER_BRUK[input.ny_bruk];
  const rooms = getKjellerRooms(input.propId);
  const room = rooms.find((r) => r.id === input.room) || rooms[0];
  const eldre = input.byggeAar < 2010;

  const findings: Finding[] = [];
  const tiltak: Tiltak[] = [];
  const lempninger: Lempning[] = [];

  // 1. TAKHØYDE — TEK17 §12-7 + lempning §31-2
  const min_h = eldre ? krav.takhoyde_lempet : krav.takhoyde_min;
  if (room.height < min_h) {
    findings.push({
      type: "fail",
      t: "Takhøyde for lav",
      d: `${room.height} mm — krav ${min_h} mm. Gulvet må graves ut, eller velg annen bruk.`,
      ref: "TEK17 § 12-7",
    });
    tiltak.push({
      name: "Senke gulv (utgraving)",
      desc: "Krever RIB-vurdering av fundament og dreneringsomlegging.",
      kostnad: 150_000,
    });
  } else {
    findings.push({
      type: "ok",
      t: "Takhøyde OK",
      d: `${room.height} mm tilfredsstiller ${eldre ? "lempet" : "vanlig"} krav (${min_h} mm).`,
      ref: "TEK17 § 12-7",
    });
    if (eldre && room.height < krav.takhoyde_min) {
      lempninger.push({
        regel: "Takhøyde",
        tekst: `${room.height} mm aksepteres iht. PBL § 31-2 og DiBK HO-3/2016 (lempet krav 2200 mm for bygg fra ${input.byggeAar}).`,
      });
    }
  }

  // 2. RØMNINGSVINDU — TEK17 §11-13 (alltid gjeldende)
  if (krav.krav_romning) {
    if (room.vinduer.includes("Lite")) {
      findings.push({
        type: "fail",
        t: "Mangler godkjent rømningsvindu",
        d: "Eksisterende vindu er for lite. Krav: bredde ≥ 0,5 m, høyde ≥ 0,6 m, sum ≥ 1,5 m, sill ≤ 1,2 m fra gulv.",
        ref: "TEK17 § 11-13 (alltid gjeldende)",
      });
      tiltak.push({
        name: "Bygge vindusbrønn + større vindu",
        desc: "Prefabrikkert betongbrønn (ACO Self el. tilsv.) med stige og avløp i bunn. Nytt vindu 1,0 × 1,0 m.",
        kostnad: 35_000,
      });
    } else if (room.vinduer === "Ingen") {
      findings.push({
        type: "fail",
        t: "Ingen vinduer i rommet",
        d: "Soverom uten vindu er ikke godkjent. Må etablere rømningsvindu.",
        ref: "TEK17 § 11-13",
      });
      tiltak.push({
        name: "Etablere vindusbrønn med rømningsvindu",
        desc: "Krever utgraving og hulltaking i kjellervegg.",
        kostnad: 65_000,
      });
    } else {
      findings.push({
        type: "ok",
        t: "Rømningsvindu OK",
        d: "Eksisterende vindu tilfredsstiller TEK17 § 11-13.",
        ref: "TEK17 § 11-13",
      });
    }
  }

  // 3. DAGSLYS — TEK17 §13-7 + lempning §31-2
  if (krav.krav_dagslys > 0) {
    const glass = room.vinduer.includes("Lite") ? 0.005 * room.area * 100 : 1.0;
    const pct = (glass / room.area) * 100;
    const target_pct = krav.krav_dagslys * 100;
    const lempet_pct = 7;
    if (pct < lempet_pct) {
      findings.push({
        type: "warn",
        t: "Lite dagslys",
        d: `Kun ~${pct.toFixed(1)}% glassflate. Mål: ${target_pct}% (kan lempes til ${lempet_pct}% for eldre bolig).`,
        ref: "TEK17 § 13-7",
      });
    } else if (eldre && pct < target_pct) {
      lempninger.push({
        regel: "Dagslys",
        tekst: `${pct.toFixed(1)}% godtas iht. PBL § 31-2 (lempet ned mot 7 % for bestående bygg når funksjonelt dagslys er prosjektert iht. NS-EN 17037).`,
      });
      findings.push({
        type: "ok",
        t: "Dagslys lempet (godkjent)",
        d: `${pct.toFixed(1)}% godtas iht. PBL § 31-2.`,
        ref: "TEK17 § 13-7 + PBL § 31-2",
      });
    } else {
      findings.push({
        type: "ok",
        t: "Dagslys OK",
        d: `${pct.toFixed(1)}% glassflate.`,
        ref: "TEK17 § 13-7",
      });
    }
  }

  // 4. RADON — TEK17 §13-5 (alltid)
  if (krav.krav_radon) {
    if (input.radon == null) {
      findings.push({
        type: "warn",
        t: "Radon ikke målt",
        d: "Bestill langtidsmåling (≥ 60 dager). Resultatet avgjør om aktivt radonanlegg trengs.",
        ref: "TEK17 § 13-5",
      });
      tiltak.push({
        name: "Radonsperre under nytt gulv",
        desc: "Diffusjonstett membran + sugerør under sperren. Aktivt anlegg installeres kun hvis måling viser > 100 Bq/m³.",
        kostnad: 18_000,
      });
    } else if (input.radon > 200) {
      findings.push({
        type: "fail",
        t: `Radon ${input.radon} Bq/m³ over grense`,
        d: "Aktivt radonanlegg er pålagt før bruksendring kan godkjennes.",
        ref: "TEK17 § 13-5",
      });
      tiltak.push({
        name: "Aktivt radonanlegg",
        desc: "Vifte + radonsperre + sugerør under gulv.",
        kostnad: 28_000,
      });
    } else if (input.radon > 100) {
      findings.push({
        type: "warn",
        t: `Radon ${input.radon} Bq/m³ over tiltaksgrense`,
        d: "Tiltak anbefales (passivt sugesystem klargjøres).",
        ref: "TEK17 § 13-5",
      });
      tiltak.push({
        name: "Passivt radonanlegg",
        desc: "Sugerør under sperren, klargjort for aktivering hvis måling stiger.",
        kostnad: 15_000,
      });
    } else {
      findings.push({
        type: "ok",
        t: `Radon OK (${input.radon} Bq/m³)`,
        d: "Under tiltaksgrense.",
        ref: "TEK17 § 13-5",
      });
    }
  }

  // 5. FUKT / DRENERING
  if (!input.drenering) {
    findings.push({
      type: "fail",
      t: "Mangler fungerende drenering",
      d: "PBL § 31-3: sikkerhetsnivået må ikke bli verre. Drenering er forutsetning før kjelleren bruksendres.",
      ref: "TEK17 § 13-13/14 + PBL § 31-3",
    });
    tiltak.push({
      name: "Renovere drenering rundt grunnmur",
      desc: "Utgraving, ny knastefolie, drensrør (DN 100), returfylling.",
      kostnad: 80_000,
    });
  } else {
    findings.push({
      type: "ok",
      t: "Drenering på plass",
      d: "Forutsetning for å bruksendre er oppfylt.",
      ref: "TEK17 § 13-13",
    });
  }
  if (input.ny_bruk !== "bad") {
    tiltak.push({
      name: "Innvendig isolering av kjellervegg",
      desc: "150 mm mineralull mellom stender, dampsperre, gips. Oppnår U ≤ 0,18 W/m²K.",
      kostnad: 60_000,
    });
  }

  // 6. VENTILASJON
  if (krav.krav_radon && !input.balansert_vent) {
    findings.push({
      type: "warn",
      t: "Anbefales: balansert ventilasjon",
      d: "Kjeller-soverom bør ha balansert ventilasjon m/varmegjenvinning. Spesielt viktig for radonkontroll og fuktbalanse.",
      ref: "TEK17 § 13-1",
    });
    tiltak.push({
      name: "Balansert ventilasjon m/varmegjenvinning",
      desc: "Sentralt aggregat + kanaler. Anbefales for hele boligen samtidig.",
      kostnad: 100_000,
    });
  }

  // 7. HYBEL — ekstra strenge krav
  if (input.ny_bruk === "hybel") {
    findings.push({
      type: "warn",
      t: "Hybel utløser strenge krav",
      d: "Egen branncelle (EI 60), egen utgang, eget brannvarslingsanlegg, R'w ≥ 55 dB lyd mellom etasjer.",
      ref: "TEK17 § 11 + § 13-9",
    });
    tiltak.push(
      { name: "Branncellevegg EI 60 mot hovedboenhet",
        desc: "Skille i etasjeskille og evt. felles vegg.", kostnad: 45_000 },
      { name: "Egen inngang fra ute",
        desc: "Trapp eller dør utvides/etableres.", kostnad: 70_000 },
      { name: "Eget brannvarslingsanlegg",
        desc: "Separat sentral, røyk- og varmevarsler.", kostnad: 12_000 },
      { name: "Lydisolasjon mellom etasjer",
        desc: "Etasjeskille bygges om til R'w ≥ 55 dB.", kostnad: 55_000 },
    );
  }

  // ENERGI-LEMPNING
  if (eldre) {
    lempninger.push({
      regel: "Energi (TEK17 § 14)",
      tekst: "Krav til U-verdi gjelder kun nye/endrede bygningsdeler — ikke hele bygget. Eksisterende konstruksjoner som ikke endres er ikke belastet.",
    });
  }

  const fails = findings.filter((f) => f.type === "fail").length;
  const warns = findings.filter((f) => f.type === "warn").length;
  const totalKostnad = tiltak.reduce((s, t) => s + t.kostnad, 0);

  let status: "green" | "amber" | "red";
  let statusText: string;
  let statusDesc: string;
  if (fails === 0 && warns === 0) {
    status = "green";
    statusText = "Klar til søknad";
    statusDesc = "Alle TEK17-krav er oppfylt. Du kan generere søknadspakke.";
  } else if (fails === 0) {
    status = "amber";
    statusText = "Klar — med tiltak";
    statusDesc = `${warns} forhold krever oppfølging, men kan dokumenteres i søknaden.`;
  } else {
    status = "red";
    statusText = "Kritiske avvik";
    statusDesc = `${fails} krav må rettes før søknad kan sendes.`;
  }

  return {
    status, statusText, statusDesc,
    findings, tiltak, lempninger, eldre,
    soknadstype: krav.soknad,
    ansvarsrett: krav.ansvarsrett,
    tiltaksklasse: input.ny_bruk === "hybel" ? 2 : 1,
    totalKostnad,
    input,
  };
}
