import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { BryggeWizard } from "@/components/wizards/BryggeWizard";

interface Props { params: Promise<{ id: string }> }

export default async function BryggePage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <BryggeWizard p={property!} />;
}
