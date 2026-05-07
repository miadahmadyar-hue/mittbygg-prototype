"use client";
import { useParams } from "next/navigation";
import { TiltakGrid } from "@/components/TiltakGrid";

export default function TiltakPage() {
  const params = useParams();
  return <TiltakGrid propertyId={params.id as string} />;
}
