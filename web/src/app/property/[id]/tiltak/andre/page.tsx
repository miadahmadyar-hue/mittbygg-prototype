import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { AndreWizard } from "@/components/wizards/AndreWizard";

interface Props { params: Promise<{ id: string }> }

export default async function AndrePage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <AndreWizard p={property!} />;
}
