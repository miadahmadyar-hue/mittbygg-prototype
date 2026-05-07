"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { VeggWizard } from "@/components/wizards/VeggWizard";
export default function Page() { return <PropertyLoader>{(p) => <VeggWizard p={p} />}</PropertyLoader>; }
