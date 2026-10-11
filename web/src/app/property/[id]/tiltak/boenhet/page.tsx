"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { BoenhetWizard } from "@/components/wizards/BoenhetWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="boenhet"><BoenhetWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
