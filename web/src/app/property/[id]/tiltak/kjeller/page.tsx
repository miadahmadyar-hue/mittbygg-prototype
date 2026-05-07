"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { KjellerWizard } from "@/components/wizards/KjellerWizard";
export default function Page() { return <PropertyLoader>{(p) => <KjellerWizard p={p} />}</PropertyLoader>; }
