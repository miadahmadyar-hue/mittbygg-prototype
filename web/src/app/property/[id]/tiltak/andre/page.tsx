"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { AndreWizard } from "@/components/wizards/AndreWizard";
export default function Page() { return <PropertyLoader>{(p) => <AndreWizard p={p} />}</PropertyLoader>; }
