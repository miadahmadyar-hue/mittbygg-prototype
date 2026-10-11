"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { VinduWizard } from "@/components/wizards/VinduWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="vindu"><VinduWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
