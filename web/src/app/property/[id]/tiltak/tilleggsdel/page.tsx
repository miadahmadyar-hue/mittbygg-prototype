"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { TilleggsdelWizard } from "@/components/wizards/TilleggsdelWizard";
export default function Page() { return <PropertyLoader>{(p) => <TilleggsdelWizard p={p} />}</PropertyLoader>; }
