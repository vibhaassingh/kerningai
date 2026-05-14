import { redirect } from "next/navigation";

interface ClientIndexProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientIndex({ params }: ClientIndexProps) {
  const { clientId } = await params;
  redirect(`/admin/clients/${clientId}/overview`);
}
