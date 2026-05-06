import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { VinduWizard } from "@/components/wizards/VinduWizard";

interface Props { params: Promise<{ id: string }> }

export default async function VinduPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <VinduWizard p={property!} />;
}
