'use client';

import { use } from 'react';
import ChatPanel from '@/components/ChatPanel';

type Params = { teamId: string; projectId: string };

export default function Chat({ params }: { params: Promise<Params> }) {
    const { projectId } = use(params);
  return <ChatPanel projectId={projectId} />;
}