'use client';
import { useState } from 'react';
import { DocList } from '@/components/DocList';
import { DocEditor } from '@/components/DocEditor';
import { use } from 'react';

type Params = { teamId: string; projectId: string };

export default function Docs({ params }:{ params: Promise<Params> }){
    const [openId, setOpenId] = useState<string | null>(null);
    const { projectId } = use(params);
  return (
    <div className="flex h-full">
      <DocList projectId={projectId} onOpen={setOpenId} />
      <DocEditor docId={openId} />
    </div>
  );
}