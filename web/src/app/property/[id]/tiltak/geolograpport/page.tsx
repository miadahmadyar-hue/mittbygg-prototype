"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { GeolograpportWizard } from "@/components/wizards/GeolograpportWizard";
export default function Page() { return <PropertyLoader>{(p) => <GeolograpportWizard p={p} />}</PropertyLoader>; }
