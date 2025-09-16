// Server Component: redirect to your preferred default tab
import { redirect } from 'next/navigation';

export default function ProjectIndex({
  params,
}: {
  params: { teamId: string; projectId: string };
}) {
  redirect(`/t/${params.teamId}/p/${params.projectId}/docs`);
}
