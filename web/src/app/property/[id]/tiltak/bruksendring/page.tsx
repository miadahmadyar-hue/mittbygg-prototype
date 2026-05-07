"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { BruksendringWizard } from "@/components/wizards/BruksendringWizard";
export default function Page() { return <PropertyLoader>{(p) => <BruksendringWizard p={p} />}</PropertyLoader>; }
