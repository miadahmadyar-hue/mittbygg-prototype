import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { TakWizard } from "@/components/wizards/TakWizard";

interface Props { params: Promise<{ id: string }> }

export default async function TakPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <TakWizard p={property!} />;
}
