import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { BruksendringWizard } from "@/components/wizards/BruksendringWizard";

interface Props { params: Promise<{ id: string }> }

export default async function BruksendringPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <BruksendringWizard p={property!} />;
}
