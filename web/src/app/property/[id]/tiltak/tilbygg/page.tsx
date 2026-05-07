"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { TilbyggWizard } from "@/components/wizards/TilbyggWizard";
export default function Page() { return <PropertyLoader>{(p) => <TilbyggWizard p={p} />}</PropertyLoader>; }
