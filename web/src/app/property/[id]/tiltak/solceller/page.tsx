"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { SolcellerWizard } from "@/components/wizards/SolcellerWizard";
export default function Page() { return <PropertyLoader>{(p) => <SolcellerWizard p={p} />}</PropertyLoader>; }
