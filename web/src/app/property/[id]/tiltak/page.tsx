import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { TiltakGrid } from "@/components/TiltakGrid";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TiltakPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <TiltakGrid propertyId={id} />;
}
