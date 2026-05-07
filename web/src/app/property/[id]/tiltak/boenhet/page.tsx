import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { BoenhetWizard } from "@/components/wizards/BoenhetWizard";

interface Props { params: Promise<{ id: string }> }

export default async function BoenhetPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <BoenhetWizard p={property!} />;
}
