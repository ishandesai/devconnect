'use client';
import Link from 'next/link';

export function Sidebar({ teamId, projectId }:{ teamId:string; projectId:string }){
  return (
    <aside className="w-48 border-r p-3 text-sm space-y-2">
      <div className="font-semibold mb-2">Project</div>
      <ul className="space-y-1">
        <li><Link href={`/t/${teamId}/p/${projectId}/docs`}>Docs</Link></li>
        <li><Link href={`/t/${teamId}/p/${projectId}/chat`}>Chat</Link></li>
        <li><Link href={`/t/${teamId}/p/${projectId}/tasks`}>Tasks</Link></li>
      </ul>
    </aside>
  );
}