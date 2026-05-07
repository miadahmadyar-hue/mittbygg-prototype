"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { VinduWizard } from "@/components/wizards/VinduWizard";
export default function Page() { return <PropertyLoader>{(p) => <VinduWizard p={p} />}</PropertyLoader>; }
