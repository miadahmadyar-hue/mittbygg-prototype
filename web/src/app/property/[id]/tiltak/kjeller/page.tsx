"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { KjellerWizard } from "@/components/wizards/KjellerWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="kjeller"><KjellerWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
