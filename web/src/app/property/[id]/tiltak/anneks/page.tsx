"use client";
import { ConversationalWizard } from "@/components/wizards/ConversationalWizard";
import { PropertyLoader } from "@/components/PropertyLoader";
import { AnneksWizard } from "@/components/wizards/AnneksWizard";
export default function Page() { return <PropertyLoader>{(p) => <ConversationalWizard p={p} slug="anneks"><AnneksWizard p={p} /></ConversationalWizard>}</PropertyLoader>; }
