import Topbar from '@/components/Topbar';
import { Sidebar } from '@/components/Sidebar';

export default function ProjectLayout({ params, children }:{ params:{ teamId:string; projectId:string }, children:React.ReactNode }){
  const { teamId, projectId } = params;
  return (
    <div className="h-dvh flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar teamId={teamId} projectId={projectId} />
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
}