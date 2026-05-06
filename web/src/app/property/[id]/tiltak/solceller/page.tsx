import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { SolcellerWizard } from "@/components/wizards/SolcellerWizard";

interface Props { params: Promise<{ id: string }> }

export default async function SolcellerPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <SolcellerWizard p={property!} />;
}
