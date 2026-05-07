"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { BoenhetWizard } from "@/components/wizards/BoenhetWizard";
export default function Page() { return <PropertyLoader>{(p) => <BoenhetWizard p={p} />}</PropertyLoader>; }
