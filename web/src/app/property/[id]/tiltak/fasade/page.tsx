"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { FasadeWizard } from "@/components/wizards/FasadeWizard";
export default function Page() { return <PropertyLoader>{(p) => <FasadeWizard p={p} />}</PropertyLoader>; }
