import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { GeolograpportWizard } from "@/components/wizards/GeolograpportWizard";

interface Props { params: Promise<{ id: string }> }

export default async function GeolograpportPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <GeolograpportWizard p={property!} />;
}
