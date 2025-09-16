// Server Component (no "use client")
import TaskBoard from '@/components/TaskBoard';

export default function TasksPage({
  params,
}: {
  params: { teamId: string; projectId: string };
}) {
  return <TaskBoard projectId={params.projectId} />;
}
