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
  rom_areal?: number | null;
  takhoyde?: number | null;
  vindu_bredde?: number | null;
  vindu_hoyde?: number | null;
  vindu_brystning?: number | null;
  godkjent_bruk_bekreftet?: boolean;
  drenering_status?: "ja" | "nei" | "usikker";
  ventilasjon_status?: "ja" | "nei" | "usikker";
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
  const hasMeasuredRoom = Boolean(input.rom_areal && input.takhoyde);
  const room = hasMeasuredRoom
    ? {
        id: input.room,
        name: input.room,
        area: input.rom_areal!,
        height: input.takhoyde!,
        vinduer: input.vindu_bredde && input.vindu_hoyde ? "Målt" : "Ukjent",
      }
    : rooms.find((r) => r.id === input.room) || rooms[0];
  const eldre = input.byggeAar < 2010;

  const findings: Finding[] = [];
  const tiltak: Tiltak[] = [];
  const lempninger: Lempning[] = [];

  if (!hasMeasuredRoom) {
    findings.push({
      type: "warn",
      t: "Rommet er ikke målt",
      d: "Areal, takhøyde og vinduer må dokumenteres før resultatet kan brukes i en søknad.",
      ref: "Dokumentasjonskrav",
    });
  }
  if (!input.godkjent_bruk_bekreftet) {
    findings.push({
      type: "warn",
      t: "Godkjent bruk er ikke bekreftet",
      d: "Siste godkjente plantegning må vise hva rommet lovlig brukes som i dag.",
      ref: "PBL § 20-1 d",
    });
  }

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
    if (eldre && room.height < krav.takhoyde_min) {
      findings.push({
        type: "warn",
        t: "Takhøyden krever konkret vurdering",
        d: `Oppgitt høyde er ${room.height} mm. For eksisterende bolig kan kommunen vurdere unntak, men løsningen er ikke automatisk godkjent.`,
        ref: "TEK17 § 12-7 og PBL § 31-4",
      });
      lempninger.push({
        regel: "Mulig unntak for takhøyde",
        tekst: `For bygg fra ${input.byggeAar} kan kommunen gjøre en konkret vurdering av eksisterende forhold. Dette må begrunnes og dokumenteres i søknaden.`,
      });
    } else {
      findings.push({
        type: "ok",
        t: "Takhøyde tilfredsstiller utgangspunktet",
        d: `Oppgitt takhøyde er ${room.height} mm.`,
        ref: "TEK17 § 12-7",
      });
    }
  }

  // 2. RØMNINGSVINDU — TEK17 §11-13 (alltid gjeldende)
  if (krav.krav_romning) {
    const hasWindowMeasurements = input.vindu_bredde != null && input.vindu_hoyde != null && input.vindu_brystning != null;
    if (!hasWindowMeasurements) {
      findings.push({
        type: "warn", t: "Rømningsvindu må måles",
        d: "Oppgi fri bredde, fri høyde og høyde fra gulv før rømningskravet kan avgjøres.",
        ref: "TEK17 § 11-13",
      });
    } else {
      const escapeOk = input.vindu_bredde! >= 0.5 && input.vindu_hoyde! >= 0.6
        && input.vindu_bredde! + input.vindu_hoyde! >= 1.5 && input.vindu_brystning! <= 1.2;
      findings.push({
        type: escapeOk ? "ok" : "fail",
        t: escapeOk ? "Rømningsvindu oppfyller målene" : "Rømningsvindu oppfyller ikke målene",
        d: `Oppgitt fri åpning ${input.vindu_bredde!.toFixed(2)} × ${input.vindu_hoyde!.toFixed(2)} m.`,
        ref: "TEK17 § 11-13",
      });
    }
  }

  // 3. DAGSLYS — TEK17 §13-7 + lempning §31-2
  if (krav.krav_dagslys > 0) {
    const glass = input.vindu_bredde && input.vindu_hoyde ? input.vindu_bredde * input.vindu_hoyde : 0;
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
        type: "warn",
        t: "Dagslys krever nærmere dokumentasjon",
        d: `Beregnet glassflate er omtrent ${pct.toFixed(1)} %. Dagslys må dokumenteres for den konkrete løsningen, og eventuelt unntak avgjøres av kommunen.`,
        ref: "TEK17 § 13-7 og PBL § 31-4",
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
  const drainageStatus = input.drenering_status ?? (input.drenering ? "ja" : "usikker");
  if (drainageStatus === "nei") {
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
  } else if (drainageStatus === "ja") {
    findings.push({
      type: "ok",
      t: "Drenering på plass",
      d: "Forutsetning for å bruksendre er oppfylt.",
      ref: "TEK17 § 13-13",
    });
  } else {
    findings.push({
      type: "warn",
      t: "Drenering og fuktsikring må undersøkes",
      d: "Alder, tilstand og tegn til fukt må avklares før rommet prosjekteres for varig opphold.",
      ref: "TEK17 § 13-13/14",
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
  const ventilationConfirmed = input.ventilasjon_status === "ja" || input.balansert_vent;
  if (krav.krav_radon && !ventilationConfirmed) {
    findings.push({
      type: "warn",
      t: "Ventilasjon må dokumenteres",
      d: "Nødvendig luftmengde og løsning må prosjekteres. Balansert ventilasjon er én mulig løsning, ikke et automatisk krav.",
      ref: "TEK17 § 13-1",
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
  let soknadstype: string;
  if (fails === 0 && warns === 0) {
    status = "green";
    statusText = "Klar til søknad";
    statusDesc = "Alle TEK17-krav er oppfylt. Du kan generere søknadspakke.";
    soknadstype = krav.soknad;
  } else if (fails === 0) {
    status = "amber";
    statusText = "Forhold må avklares";
    statusDesc = `${warns} forhold krever dokumentasjon eller faglig vurdering før søknadsgrunnlaget er klart.`;
    soknadstype = `Må avklares - ${krav.soknad}`;
  } else {
    status = "red";
    statusText = "Kritiske avvik";
    statusDesc = `${fails} krav må rettes før søknad kan sendes.`;
    soknadstype = `Må avklares - ${krav.soknad}`;
  }

  return {
    status, statusText, statusDesc,
    findings, tiltak, lempninger, eldre,
    soknadstype,
    ansvarsrett: krav.ansvarsrett,
    tiltaksklasse: input.ny_bruk === "hybel" ? 2 : 1,
    totalKostnad,
    input,
  };
}
