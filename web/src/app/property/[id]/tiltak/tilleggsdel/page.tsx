"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { TilleggsdelWizard } from "@/components/wizards/TilleggsdelWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="tilleggsdel"><TilleggsdelWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
