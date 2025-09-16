'use client';

import { useParams } from 'next/navigation';
import ChatPanel from '@/components/ChatPanel';

export default function Chat() {
  const { projectId } = useParams<{ teamId: string; projectId: string }>();
  return <ChatPanel projectId={projectId} />;
}
