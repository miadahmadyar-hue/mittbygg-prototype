export interface PreparationGuide {
  title: string;
  prompt: string;
  documents: string[];
  checks: string[];
}

export const PREPARATION: Record<string, PreparationGuide> = {
  garasje: {
    title: "Garasje eller carport",
    prompt: "Beskriv adkomst, terreng, fundamentering og eventuell riving. Oppgi både BRA og BYA hvis du kjenner dem.",
    documents: ["Situasjonskart med avstander", "Plan, fasader og snitt med høyder", "Bilder av tomt og adkomst"],
    checks: ["Plan, byggegrenser og utnyttelsesgrad kontrollert", "BRA, BYA, høyder og avstander målt", "Adkomst, ledninger, brann og grunnforhold avklart"],
  },
  anneks: {
    title: "Anneks, uthus eller hagebod",
    prompt: "Beskriv bruken, eventuell overnatting, vann/avløp og plassering på tomten. Oppgi både BRA og BYA hvis kjent.",
    documents: ["Situasjonskart", "Plan, fasader og snitt", "Bilder av tomten"],
    checks: ["Bruk og eventuell overnatting avklart", "Plan, utnyttelsesgrad og byggegrenser kontrollert", "Mål, brannavstander, ledninger og fundamentering avklart"],
  },
  tilbygg: {
    title: "Tilbygg eller påbygg",
    prompt: "Beskriv hvordan tilbygget knyttes til huset, bruk av rommene, fundamentering og inngrep i eksisterende bæring.",
    documents: ["Godkjente eksisterende tegninger", "Plan, snitt og fasader før og etter", "Situasjonskart med avstander"],
    checks: ["Plan, byggegrenser og samlet utnyttelsesgrad kontrollert", "BRA/BYA, høyder og avstander dokumentert", "Bæring, brann, fundamentering og eventuell ny boenhet avklart"],
  },
  fasade: {
    title: "Fasade eller terrasse",
    prompt: "Beskriv materialer, farger, hvilke fasader som endres og eventuelle inngrep i bæring. For terrasse: rekkverk, terreng og tilknytning til huset.",
    documents: ["Bilder av fasaden eller uteområdet", "Fasader før og etter", "Målsatt plan/snitt og situasjonskart ved terrasse"],
    checks: ["Plan og vernestatus kontrollert", "Eksisterende og ønsket utseende dokumentert", "Bæring, brann, avstander og eiergodkjenning avklart"],
  },
  vindu: {
    title: "Vindu eller dør",
    prompt: "Oppgi antall, mål, plassering, materiale og utseende før og etter. Beskriv om åpningen endres og hva du vet om veggens konstruksjon.",
    documents: ["Foto av hele fasaden", "Fasadetegning før og etter med mål", "Plantegning og eventuell brann- eller konstruksjonsdokumentasjon"],
    checks: ["Vern og lokale fasadebestemmelser kontrollert", "Bæring og brannskille avklart", "Dagslys, rømning, energi og eiergodkjenning vurdert der relevant"],
  },
  tak: {
    title: "Tak eller loft",
    prompt: "Beskriv dagens og ønsket tak, materialer, høyder og bæring. For loft: godkjent bruk, romhøyder, trapp, vinduer og eventuell utleie.",
    documents: ["Bilder av tak og loft", "Plan, snitt og fasader før og etter", "Godkjente tegninger og eventuelle beregninger"],
    checks: ["Plan, høyder og vernestatus kontrollert", "Laster, bæring og fuktsikkerhet avklart", "Godkjent loftsbruk og krav til rom, trapp og rømning avklart ved innredning"],
  },
  boenhet: {
    title: "Ny boenhet eller utleiedel",
    prompt: "Beskriv dagens godkjente bruk, intern forbindelse, inngang, kjøkken og bad. Oppgi hvilke rom som eventuelt må bruksendres.",
    documents: ["Godkjente tegninger og vedtak", "Plan og snitt med begge boligdelene", "Situasjonskart med adkomst og uteareal"],
    checks: ["Godkjent bruk og de tre oppdelingskriteriene dokumentert", "Plan, parkering og uteareal avklart", "Brann, lyd, tilgjengelighet og behov for ansvarlig søker avklart"],
  },
  tilleggsdel: {
    title: "Endre bruk av rom",
    prompt: "Beskriv godkjent og ønsket bruk, byggeår, romhøyde, vinduer og tilgang fra resten av boligen. Oppgi hva som er ukjent.",
    documents: ["Godkjente tegninger og vedtak", "Plan og snitt før og etter med mål", "Bilder og relevante fagrapporter"],
    checks: ["Godkjent bruk som hoveddel eller tilleggsdel kontrollert", "Romhøyde, dagslys, rømning og ventilasjon vurdert for ny bruk", "Fukt, radon, brann, bæring og eventuell oppdeling avklart"],
  },
  levegg: {
    title: "Levegg",
    prompt: "Beskriv plassering, materiale, terreng og fundamentering. Ta med nærhet til vei, kryss, nabo eller annen skjerming.",
    documents: ["Kart med plassering og nabogrense", "Skisse med høyde og samlet lengde", "Bilder av plasseringen"],
    checks: ["Høyde, samlet lengde og avstand dokumentert", "Plan, byggegrenser og frisikt kontrollert", "Fundamentering og vindbelastning avklart"],
  },
  brygge: {
    title: "Brygge og strandsone",
    prompt: "Beskriv eksisterende tillatelser, forankring, sjøbunn og planlagte endringer. Oppgi eventuell mudring eller utfylling.",
    documents: ["Kart med strandlinje og plassering", "Bilder, mål og konstruksjonsskisse", "Tidligere tillatelser og rett til grunnen"],
    checks: ["Plan og byggegrense mot sjø avklart", "Eierskap og relevante myndighetstillatelser avklart", "Naturhensyn, sjøbunn, forankring og fundamentering vurdert"],
  },
  geolograpport: {
    title: "Grunnforhold og fagrapport",
    prompt: "Beskriv byggearbeid, graving, terreng og kjente grunnforhold. Har kommunen bedt om en bestemt rapport? Oppgi ønsket tidspunkt; levering avtales etter gjennomgang.",
    documents: ["Situasjonskart og terrengsnitt", "Kommunens krav eller tidligere rapporter", "Bilder av tomt, skråninger og nabobygg"],
    checks: ["Tiltak og ønsket dokumentasjonsnivå beskrevet", "Eksisterende rapporter og relevante farekart undersøkt", "Behov for befaring eller grunnundersøkelse avklart med fagperson"],
  },
  andre: {
    title: "Andre tiltak",
    prompt: "Suppler med mål, plassering, dagens godkjente bruk og ønsket løsning. Ta med tidligere kommunale avklaringer og spørsmål du ønsker hjelp med.",
    documents: ["Bilder og enkel skisse", "Kart eller relevante godkjente tegninger", "Tidligere vedtak eller korrespondanse"],
    checks: ["Omfang og plassering beskrevet", "Plan og godkjent bruk undersøkt", "Behov for fagperson og øvrige tillatelser avklart"],
  },
  vegg: {
    title: "Innvendig vegg",
    prompt: "Beskriv veggens plassering og rommene før og etter. Oppgi hva som er kjent om bæring, brannskille og installasjoner.",
    documents: ["Plantegning før og etter", "Bilder av veggen", "Dokumentasjon av bæring og brannskille"],
    checks: ["Bæring og brannskille kontrollert av fagperson", "Ventilasjon, rømning og rombruk avklart", "Eierforhold og installasjoner i veggen avklart"],
  },
};
