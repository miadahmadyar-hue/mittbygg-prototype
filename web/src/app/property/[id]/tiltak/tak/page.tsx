"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { TakWizard } from "@/components/wizards/TakWizard";
export default function Page() { return <PropertyLoader>{(p) => <TakWizard p={p} />}</PropertyLoader>; }
