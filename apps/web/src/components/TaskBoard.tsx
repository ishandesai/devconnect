'use client';
import { useMutation, useQuery } from '@apollo/client/react';
import { TASKS, ADD_TASK } from '@/lib/graphql';

export default function TaskBoard({ projectId }:{ projectId:string }){
  const { data, refetch } = useQuery(TASKS, { variables:{ projectId } });
  const [addTask] = useMutation(ADD_TASK, { onCompleted: ()=>refetch() });
  const tasks = (data?.tasks ?? []) as any[];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-medium">Tasks</h2>
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>{
          const title = prompt('Task title?') || 'New Task';
          addTask({ variables:{ projectId, title } });
        }}>+ Add</button>
      </div>
      <ul className="space-y-1">
        {tasks.map(t=> <li key={t.id} className="border px-3 py-2 rounded text-sm">{t.title}</li>)}
      </ul>
    </div>
  );
}