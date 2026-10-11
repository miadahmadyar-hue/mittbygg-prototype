"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { FasadeWizard } from "@/components/wizards/FasadeWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="fasade"><FasadeWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
