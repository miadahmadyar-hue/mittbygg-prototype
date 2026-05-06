import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { FasadeWizard } from "@/components/wizards/FasadeWizard";

interface Props { params: Promise<{ id: string }> }

export default async function FasadePage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <FasadeWizard p={property!} />;
}
