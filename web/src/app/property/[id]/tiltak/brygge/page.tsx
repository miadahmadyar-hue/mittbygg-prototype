"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { BryggeWizard } from "@/components/wizards/BryggeWizard";
export default function Page() { return <PropertyLoader>{(p) => <BryggeWizard p={p} />}</PropertyLoader>; }
