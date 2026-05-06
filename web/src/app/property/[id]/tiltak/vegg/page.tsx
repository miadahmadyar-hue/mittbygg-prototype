import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { VeggWizard } from "@/components/wizards/VeggWizard";

interface Props { params: Promise<{ id: string }> }

export default async function VeggPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <VeggWizard p={property!} />;
}
