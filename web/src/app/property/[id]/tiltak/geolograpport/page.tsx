"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { GeolograpportWizard } from "@/components/wizards/GeolograpportWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="geolograpport"><GeolograpportWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
