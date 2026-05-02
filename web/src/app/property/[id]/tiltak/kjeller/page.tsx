import { notFound } from "next/navigation";
import { findAddress } from "@/lib/data/addresses";
import { KjellerWizard } from "@/components/wizards/KjellerWizard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KjellerPage({ params }: Props) {
  const { id } = await params;
  const property = findAddress(id);
  if (!property) notFound();
  return <KjellerWizard p={property} />;
}
