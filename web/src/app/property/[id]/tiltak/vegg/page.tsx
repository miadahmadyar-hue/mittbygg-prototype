import { notFound } from "next/navigation";
import { findAddress } from "@/lib/data/addresses";
import { VeggWizard } from "@/components/wizards/VeggWizard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VeggPage({ params }: Props) {
  const { id } = await params;
  const property = findAddress(id);
  if (!property) notFound();
  return <VeggWizard p={property} />;
}
