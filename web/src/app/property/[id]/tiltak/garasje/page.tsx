import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { GarasjeWizard } from "@/components/wizards/GarasjeWizard";

interface Props { params: Promise<{ id: string }> }

export default async function GarasjePage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <GarasjeWizard p={property!} />;
}
