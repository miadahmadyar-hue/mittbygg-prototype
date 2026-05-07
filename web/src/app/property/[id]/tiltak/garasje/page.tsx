"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { GarasjeWizard } from "@/components/wizards/GarasjeWizard";
export default function Page() { return <PropertyLoader>{(p) => <GarasjeWizard p={p} />}</PropertyLoader>; }
