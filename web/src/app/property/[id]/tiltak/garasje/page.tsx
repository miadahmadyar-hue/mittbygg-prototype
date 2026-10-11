"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { GarasjeWizard } from "@/components/wizards/GarasjeWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="garasje"><GarasjeWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
