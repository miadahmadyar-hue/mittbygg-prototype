import { notFound } from "next/navigation";
import { findAddress } from "@/lib/data/addresses";
import { TiltakGrid } from "@/components/TiltakGrid";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TiltakPage({ params }: Props) {
  const { id } = await params;
  const property = findAddress(id);
  if (!property) notFound();
  return <TiltakGrid propertyId={id} />;
}
