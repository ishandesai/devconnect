import { use } from 'react';
import TaskBoard from '@/components/TaskBoard';

type Params = { teamId: string; projectId: string };

export default function Tasks({ params }: { params: Promise<Params> }) {
  const { projectId } = use(params);
  return <TaskBoard projectId={projectId} />;
}