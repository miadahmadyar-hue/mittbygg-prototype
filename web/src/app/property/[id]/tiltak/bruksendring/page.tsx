"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { BruksendringWizard } from "@/components/wizards/BruksendringWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="bruksendring"><BruksendringWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
