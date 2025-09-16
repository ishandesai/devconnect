'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DocList } from '@/components/DocList';
import { CollaborativeEditor } from '@/components/CollaborativeEditor';

export default function Docs() {
  const { projectId } = useParams<{ teamId: string; projectId: string }>();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      <DocList projectId={projectId} onOpen={setOpenId} />
      <div className="flex-1">
        {openId ? (
          <CollaborativeEditor docId={openId} />
        ) : (
          <p className="p-4 text-sm text-gray-500">Select a document</p>
        )}
      </div>
    </div>
  );
}
