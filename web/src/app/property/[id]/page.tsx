"use client";
import { PropertyLoader } from "@/components/PropertyLoader";
import { PropertyDashboard } from "@/components/PropertyDashboard";
export default function PropertyPage() { return <PropertyLoader>{(p) => <PropertyDashboard p={p} />}</PropertyLoader>; }
