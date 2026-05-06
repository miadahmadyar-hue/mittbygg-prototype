import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { LevegWizard } from "@/components/wizards/LevegWizard";

interface Props { params: Promise<{ id: string }> }

export default async function LevegPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <LevegWizard p={property!} />;
}
