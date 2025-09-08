'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  CHANNELS,
  CREATE_CHANNEL,
  MESSAGES,
  SEND_MESSAGE,
  MESSAGE_ADDED,
} from '@/lib/graphql';

export default function ChatPanel({ projectId }: { projectId: string }) {
  const { data: cdata, refetch: refetchChannels } = useQuery(CHANNELS, {
    variables: { projectId },
  });

  const [channelId, setChannelId] = useState<string | null>(null);

  // Load messages for the selected channel
  const { data, loading, subscribeToMore } = useQuery(MESSAGES, {
    variables: { channelId },
    skip: !channelId,
    fetchPolicy: 'cache-and-network',
  });

  // Subscribe when channel changes
  useEffect(() => {
    if (!channelId) return;
    const unsub = subscribeToMore({
      document: MESSAGE_ADDED,
      variables: { channelId },
      onError: console.error,
      updateQuery: (prev, { subscriptionData }) => {
        const next = subscriptionData.data?.messageAdded;
        if (!next) return prev;
        if (prev.messages?.some((m: any) => m.id === next.id)) return prev;
        return { ...prev, messages: [...(prev.messages ?? []), next] };
      },
    });
    return () => unsub();
  }, [channelId, subscribeToMore]);

  const [send] = useMutation(SEND_MESSAGE, {
    onError: console.error,
  });

  const [create] = useMutation(CREATE_CHANNEL, {
    onCompleted: () => refetchChannels(),
  });

  // Pick first channel automatically
  useEffect(() => {
    if (!channelId && cdata?.channels?.[0]) setChannelId(cdata.channels[0].id);
  }, [cdata, channelId]);

  // Scroll handling
  const listRef = useRef<HTMLDivElement>(null);
  const scrollToEnd = () =>
    requestAnimationFrame(() =>
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    );
  const msgs = data?.messages ?? [];
  useEffect(() => {
    if (!loading) scrollToEnd();
  }, [msgs.length, channelId, loading]);

  return (
    <div className="flex w-full h-full">
      <aside className="w-56 border-r p-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <b>Channels</b>
          <button
            className="text-xs px-2 py-1 border rounded"
            onClick={() => {
              const name = prompt('Channel name?') || 'general';
              create({ variables: { projectId, name } });
            }}
          >
            + New
          </button>
        </div>
        <ul className="space-y-1">
          {(cdata?.channels ?? []).map((c: any) => (
            <li key={c.id}>
              <button
                className={`underline ${
                  channelId === c.id ? 'font-semibold' : ''
                }`}
                onClick={() => setChannelId(c.id)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex-1 flex flex-col">
        <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2">
          {msgs.map((m: any) => (
            <div key={m.id} className="text-sm">
              <b>{m.author?.name || m.author?.email || 'unknown'}</b>: {m.body}
            </div>
          ))}
          {loading && <div className="text-xs text-gray-500">Loading…</div>}
        </div>

        {channelId && (
          <form
            className="p-3 border-t flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const body = String(f.get('body') || '').trim();
              if (!body) return;

              // Optimistic UI + write to the right messages(channelId) list
              const optimistic = {
                __typename: 'Message',
                id: `temp-${Date.now()}`,
                body,
                createdAt: new Date().toISOString(),
                author: {
                  __typename: 'User',
                  id: 'me',
                  name: 'me',
                  email: '',
                },
              };

              send({
                variables: { channelId, body },
                optimisticResponse: { sendMessage: optimistic },
                update: (cache, { data }) => {
                  const newMsg = data?.sendMessage ?? optimistic;
                  const vars = { channelId };
                  const existing: any =
                    cache.readQuery({ query: MESSAGES, variables: vars }) ??
                    { messages: [] };
                  if (
                    existing.messages.some((m: any) => m.id === newMsg.id)
                  )
                    return;

                  cache.writeQuery({
                    query: MESSAGES,
                    variables: vars,
                    data: { messages: [...existing.messages, newMsg] },
                  });
                },
              });

              (e.currentTarget as HTMLFormElement).reset();
              scrollToEnd();
            }}
          >
            <input
              name="body"
              placeholder="Message…"
              className="flex-1 border px-3 py-2"
            />
            <button className="px-3 py-2 bg-black text-white rounded">
              Send
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
