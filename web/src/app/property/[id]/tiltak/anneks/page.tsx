import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { AnneksWizard } from "@/components/wizards/AnneksWizard";

interface Props { params: Promise<{ id: string }> }

export default async function AnneksPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <AnneksWizard p={property!} />;
}
