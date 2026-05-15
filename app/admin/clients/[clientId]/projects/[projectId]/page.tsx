import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ clientId: string; projectId: string }>;
}

export default async function ProjectIndex({ params }: Props) {
  const { clientId, projectId } = await params;
  redirect(`/admin/clients/${clientId}/projects/${projectId}/overview`);
}
