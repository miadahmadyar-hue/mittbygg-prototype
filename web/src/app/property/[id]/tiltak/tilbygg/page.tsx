import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { TilbyggWizard } from "@/components/wizards/TilbyggWizard";

interface Props { params: Promise<{ id: string }> }

export default async function TilbyggPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <TilbyggWizard p={property!} />;
}
