"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { AndreWizard } from "@/components/wizards/AndreWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="andre"><AndreWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
