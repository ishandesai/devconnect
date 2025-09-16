'use client';

import { useEffect, useRef, useState } from 'react';
import { ClientSideSuspense, RoomProvider } from '@liveblocks/react/suspense';
import { useLiveblocksExtension, FloatingToolbar } from '@liveblocks/react-tiptap';
import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

// ✅ Your Apollo version’s types say hooks are under /react
import { useMutation, useQuery } from '@apollo/client/react';

import { LiveList, LiveMap } from '@liveblocks/client';
import { useOthers, useUpdateMyPresence } from '@liveblocks/react';

import {
  DOCUMENT,
  UPDATE_DOCUMENT_CONTENT,
  type DocumentQuery,
  type DocumentVariables,
  type UpdateDocumentContentMutation,
  type UpdateDocumentContentVariables,
} from '@/lib/graphql';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar';

export function CollaborativeEditor({ docId }: { docId: string }) {
  return (
    <RoomProvider
      id={`doc:${docId}`}
      // ❗ Do NOT try to add generics in JSX props; just pass the object
      // and keep the shape Liveblocks expects by default (cursor/selection)
      initialPresence={{
        cursor: null,
        selection: null,
      }}
      initialStorage={{
        docTitle: '',
        outline: new LiveList<{ id: string; text: string }>([]),
        meta: new LiveMap<string, string>(),
      }}
    >
      <ClientSideSuspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" text="Loading editor..." />
          </div>
        }
      >
        <EditorInner docId={docId} />
      </ClientSideSuspense>
    </RoomProvider>
  );
}

function EditorInner({ docId }: { docId: string }) {
  // ✅ Fully typed query/mutation from your TypedDocumentNodes
  const { data, loading } = useQuery<DocumentQuery, DocumentVariables>(DOCUMENT, {
    variables: { id: docId },
  });
  const [save] = useMutation<
    UpdateDocumentContentMutation,
    UpdateDocumentContentVariables
  >(UPDATE_DOCUMENT_CONTENT);

  // Presence: your installed @liveblocks/react requires a selector for useOthers,
  // and the default presence type only allows cursor/selection.
  const updateMyPresence = useUpdateMyPresence();
  useEffect(() => {
    // If you want custom fields (e.g., userInfo), you must configure generics at RoomProvider level
    // in this library version. For now, stick to default keys.
    updateMyPresence({}); // no-op; demonstrates the API without adding unknown keys
  }, [updateMyPresence]);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedJsonRef = useRef<string | null>(null);

  // Your version requires a selector argument
  const others = useOthers((list) => list);

  const liveblocks = useLiveblocksExtension();

  const editor = useEditor({
    extensions: [StarterKit.configure({ history: false }), liveblocks],
    content: '', // set after query resolves
    autofocus: true,
  });

  // Load server content once available
  useEffect(() => {
    if (!editor) return;
    const raw = data?.document?.content; // schema says non-null string; undefined until data loads
    if (typeof raw === 'string') {
      try {
        const parsed = (raw.trim() ? JSON.parse(raw) : { type: 'doc', content: [] }) as JSONContent;
        editor.commands.setContent(parsed, false);
        lastSavedJsonRef.current = JSON.stringify(parsed);
      } catch {
        editor.commands.setContent({ type: 'doc', content: [] }, false);
        lastSavedJsonRef.current = JSON.stringify({ type: 'doc', content: [] });
      }
    }
  }, [editor, data?.document?.content]);

  // Debounced autosave
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      if (tRef.current) clearTimeout(tRef.current);
      tRef.current = setTimeout(async () => {
        try {
          const jsonStr = JSON.stringify(editor.getJSON());
          if (jsonStr === lastSavedJsonRef.current) return;

          setIsSaving(true);
          await save({ variables: { id: docId, content: jsonStr } });
          lastSavedJsonRef.current = jsonStr;
          setLastSaved(new Date());
        } catch (error) {
          console.error('Failed to save document:', error);
        } finally {
          setIsSaving(false);
        }
      }, 800);
    };

    editor.on('update', onUpdate);
    return () => {
      editor.off('update', onUpdate);
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [editor, save, docId]);

  if (loading || !editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading document..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <Card variant="elevated" className="bg-white border-0">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {data?.document?.title || 'Untitled Document'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Collaborative document editor
              </p>
            </div>

            {others.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">
                  {others.length} other{others.length > 1 ? 's' : ''} editing
                </span>
                <div className="flex -space-x-1">
                {others.slice(0, 3).map((other) => (
  <Avatar key={other.connectionId} name="Anonymous" size="sm" />
))}
                  {others.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white">
                      +{others.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4" aria-live="polite">
            {isSaving && <LoadingSpinner size="sm" text="Saving..." />}
            {lastSaved && !isSaving && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>
                  Saved at{' '}
                  {lastSaved.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Toolbar */}
      <Card variant="outlined" className="p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant={editor.isActive('bold') ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </Button>
          <Button
            variant={editor.isActive('strike') ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <s>S</s>
          </Button>

          <div className="w-px h-6 bg-gray-200" />

          <Button
            variant={editor.isActive('heading', { level: 1 }) ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </Button>
          <Button
            variant={editor.isActive('heading', { level: 2 }) ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </Button>
          <Button
            variant={editor.isActive('heading', { level: 3 }) ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </Button>

          <div className="w-px h-6 bg-gray-200" />

          <Button
            variant={editor.isActive('bulletList') ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </Button>

          <div className="w-px h-6 bg-gray-200" />

          <Button
            variant={editor.isActive('codeBlock') ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            {'</>'}
          </Button>
          <Button
            variant={editor.isActive('blockquote') ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            Quote
          </Button>
        </div>
      </Card>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Card variant="elevated" className="h-full border-0">
          <EditorContent
            editor={editor}
            className="prose max-w-none p-8 min-h-[70vh] focus:outline-none"
          />
        </Card>
      </div>

      {editor && <FloatingToolbar editor={editor} />}
    </div>
  );
}
