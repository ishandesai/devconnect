'use client';
import { useMutation, useQuery } from '@apollo/client/react';
import { DOCUMENTS, CREATE_DOCUMENT } from '@/lib/graphql';

export function DocList({
  projectId,
  onOpen,
}: {
  projectId: string;
  onOpen: (id: string) => void;
}) {
  const { data, refetch } = useQuery(DOCUMENTS, { variables: { projectId } });
  const [createDoc] = useMutation(CREATE_DOCUMENT, {
    onCompleted: () => refetch(),
  });
  return (
    <div className="w-60 border-r p-3 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <b>Documents</b>
        <button
          className="text-xs px-2 py-1 border rounded"
          onClick={() => {
            const title = prompt('Title?') || 'Untitled';
            createDoc({ variables: { projectId, title } });
          }}
        >
          + New
        </button>
      </div>
      <ul className="space-y-1">
        {(data?.documents ?? []).map((d: any) => (
          <li key={d.id}>
            <button onClick={() => onOpen(d.id)} className="underline">
              {d.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
