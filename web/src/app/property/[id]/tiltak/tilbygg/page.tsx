"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { TilbyggWizard } from "@/components/wizards/TilbyggWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="tilbygg"><TilbyggWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
