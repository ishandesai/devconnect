'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  DOCUMENTS,
  CREATE_DOCUMENT,
  type DocumentsQuery,
  type DocumentsVariables,
  type CreateDocumentMutation,
  type CreateDocumentVariables,
} from '@/lib/graphql';

import { formatRelativeTime } from '@/lib/design-system';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DocListProps {
  projectId: string;
  onOpen: (id: string) => void;
  selectedDocId?: string | null;
}

export function DocList({ projectId, onOpen, selectedDocId }: DocListProps) {
  const { data, loading, error } = useQuery<DocumentsQuery, DocumentsVariables>(
    DOCUMENTS,
    { variables: { projectId } }
  );

  const [createError, setCreateError] = useState<string | null>(null);

  const [createDoc, { loading: creating }] = useMutation<
    CreateDocumentMutation,
    CreateDocumentVariables
  >(CREATE_DOCUMENT);

  const documents = (data?.documents ?? [])
    .slice()
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  const handleCreateDoc = async () => {
    setCreateError(null);
    const raw = (prompt('Document title?') || 'Untitled').trim();
    if (!raw) return;

    const title = raw;
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Strongly typed optimistic doc
    const optimisticDoc: CreateDocumentMutation['createDocument'] & {
      __typename: 'Document';
    } = {
      __typename: 'Document',
      id: tempId,
      title,
      updatedAt: nowIso,
    };
    
    try {
      await createDoc({
        variables: { projectId, title },
        optimisticResponse: { createDocument: optimisticDoc },
        update: (cache, { data }) => {
          const newDoc = data?.createDocument ?? optimisticDoc;

          const vars: DocumentsVariables = { projectId };
          const existing =
            cache.readQuery<DocumentsQuery, DocumentsVariables>({
              query: DOCUMENTS,
              variables: vars,
            })?.documents ?? [];

          if (existing.some((d) => d.id === newDoc.id)) return;

          cache.writeQuery<DocumentsQuery, DocumentsVariables>({
            query: DOCUMENTS,
            variables: vars,
            data: { documents: [newDoc, ...existing] },
          });
        },
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create document';
      setCreateError(msg);
    }
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-600 mt-1">Collaborative editing</p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={handleCreateDoc}
          disabled={creating}
        >
          {creating ? 'Creating…' : '+ New Doc'}
        </Button>
      </div>

      {createError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {createError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Loading documents..." />
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 text-center py-8">
          Failed to load documents
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              variant={selectedDocId === doc.id ? 'elevated' : 'default'}
              className={`cursor-pointer transition-all duration-200 group ${
                selectedDocId === doc.id
                  ? 'bg-blue-50 border-blue-200 shadow-md'
                  : 'hover:shadow-md hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onOpen(doc.id)}
            >
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>
                  {selectedDocId === doc.id && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {`Updated ${formatRelativeTime(doc.updatedAt)}`}
                </div>
              </div>
            </Card>
          ))}

          {documents.length === 0 && (
            <Card variant="flat" className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <div className="text-sm font-medium text-gray-900 mb-2">
                No documents yet
              </div>
              <div className="text-xs text-gray-500">
                Create your first document to get started
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
