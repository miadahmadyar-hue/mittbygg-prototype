import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { TilleggsdelWizard } from "@/components/wizards/TilleggsdelWizard";

interface Props { params: Promise<{ id: string }> }

export default async function TilleggsdelPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <TilleggsdelWizard p={property!} />;
}
