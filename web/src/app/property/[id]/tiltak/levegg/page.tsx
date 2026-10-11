"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { LevegWizard } from "@/components/wizards/LevegWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="levegg"><LevegWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
