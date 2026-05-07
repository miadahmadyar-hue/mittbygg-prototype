"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { LevegWizard } from "@/components/wizards/LevegWizard";
export default function Page() { return <PropertyLoader>{(p) => <LevegWizard p={p} />}</PropertyLoader>; }
