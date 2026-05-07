"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { AnneksWizard } from "@/components/wizards/AnneksWizard";
export default function Page() { return <PropertyLoader>{(p) => <AnneksWizard p={p} />}</PropertyLoader>; }
