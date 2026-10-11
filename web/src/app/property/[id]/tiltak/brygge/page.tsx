"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { BryggeWizard } from "@/components/wizards/BryggeWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="brygge"><BryggeWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
