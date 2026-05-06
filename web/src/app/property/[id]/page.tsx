import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/fetchProperty";
import { PropertyDashboard } from "@/components/PropertyDashboard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <PropertyDashboard p={property!} />;
}
