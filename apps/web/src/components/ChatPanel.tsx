'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CHANNELS,
  MESSAGES,
  SEND_MESSAGE,
  CREATE_CHANNEL,
  MESSAGE_ADDED,
  // types only (from your TypedDocumentNodes)
  type ChannelsQuery,
  type ChannelsVariables,
  type MessagesQuery,
  type MessagesVariables,
} from '@/lib/graphql';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type ID = string;
type Channel = ChannelsQuery['channels'][number];
type ChatMessage = MessagesQuery['messages'][number];

export default function ChatPanel({ projectId }: { projectId: string }) {
  // Channels list (TypedDocumentNode → types inferred)
  const { data: cdata } = useQuery(CHANNELS, { variables: { projectId } });
  const channels = cdata?.channels ?? [];

  const [channelId, setChannelId] = useState<ID | null>(null);

  // Messages for the selected channel
  const { data, loading, subscribeToMore } = useQuery(MESSAGES, {
    variables: { channelId: channelId ?? '' },
    skip: !channelId, // avoid network call until we have a channelId
    fetchPolicy: 'cache-and-network',
  });

  // Live updates (subscription) using subscribeToMore; types inferred from docs
  useEffect(() => {
    if (!channelId) return;

    const unsubscribe = subscribeToMore({
      document: MESSAGE_ADDED,
      variables: { channelId },
      onError: console.error,
      updateQuery: (prev, { subscriptionData }) => {
        const next = subscriptionData.data?.messageAdded;

        // Make a concrete list (not DeepPartial)
        const baseList = ((prev?.messages ?? []) as MessagesQuery['messages']).filter(
          (m): m is MessagesQuery['messages'][number] => Boolean(m)
        );

        if (!next) return { messages: baseList };
        if (baseList.some((m) => m.id === next.id)) return { messages: baseList };

        return { messages: [...baseList, next] };
      },
    });

    return () => unsubscribe();
  }, [channelId, subscribeToMore]);

  // Mutations (TypedDocumentNode → no generics)
  const [send] = useMutation(SEND_MESSAGE, { onError: console.error });
  const [create] = useMutation(CREATE_CHANNEL, {
    refetchQueries: [{ query: CHANNELS, variables: { projectId } }],
  });

  // Default to first channel when available
  useEffect(() => {
    if (!channelId && channels[0]) setChannelId(channels[0].id);
  }, [channels, channelId]);

  // Scrolling
  const listRef = useRef<HTMLDivElement>(null);
  const scrollToEnd = () =>
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });

  const msgs = data?.messages ?? [];

  useEffect(() => {
    if (!loading) scrollToEnd();
  }, [msgs.length, channelId, loading]);

  return (
    <div className="flex w-full h-full gap-6">
      {/* Channels Sidebar */}
      <Card className="w-80 p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Channels</h2>
            <p className="text-sm text-gray-600 mt-1">Team communication</p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={async () => {
              const name = prompt('Channel name?')?.trim();
              if (!name) return;
              // ⬇️ top-level variables (schema expects $projectId, $name)
              await create({ variables: {input: { projectId, name } } });
            }}
          >
            + New
          </Button>
        </div>
        <ul className="space-y-2">
          {channels.map((c: Channel) => (
            <li key={c.id}>
              <button
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
                  channelId === c.id
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setChannelId(c.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 group-hover:text-gray-600">#</span>
                  <span>{c.name}</span>
                  {channelId === c.id && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {/* Messages */}
      <Card variant="elevated" className="flex-1 flex flex-col min-h-0">
        <header className="h-16 flex items-center px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <span className="text-gray-400 text-lg">#</span>
            <span className="font-bold text-gray-900 text-lg">
              {channelId
                ? channels.find((c) => c.id === channelId)?.name ?? ''
                : 'Select a channel'}
            </span>
          </div>
        </header>

        <div ref={listRef} className="flex-1 overflow-auto p-6 space-y-4">
          {!channelId && (
            <EmptyState
              emoji="💬"
              title="Welcome to Chat"
              subtitle="Pick a channel to start chatting"
            />
          )}

          {channelId && msgs.length === 0 && !loading && (
            <EmptyState
              emoji="👋"
              title="No messages yet"
              subtitle="Say hi to get the conversation started!"
            />
          )}

          {msgs.map((m) => (
            <MessageRow key={m.id} msg={m} />
          ))}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" text="Loading messages..." />
            </div>
          )}
        </div>

        {/* Composer */}
        {channelId && (
          <form
            key={channelId}
            className="p-3 border-t border-gray-200 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const body = String(f.get('body') || '').trim();
              if (!body) return;

              // Optimistic result exactly matches the selection set of SEND_MESSAGE
              const optimistic = {
                __typename: 'Message',
                id: `temp-${Date.now()}`,
                body,
                createdAt: new Date().toISOString(),
                author: {
                  __typename: 'User',
                  id: 'me',
                  name: 'You',
                  email: '',
                },
              };

              await send({
                // ⬇️ top-level variables (schema expects $channelId, $body)
                variables: { input: { channelId, body } },
                optimisticResponse: { sendMessage: optimistic },
                update: (cache, { data }) => {
                  const newMsg = data?.sendMessage ?? optimistic;
                  const vars: MessagesVariables = { channelId };
                  const existing =
                    cache.readQuery<MessagesQuery, MessagesVariables>({
                      query: MESSAGES,
                      variables: vars,
                    })?.messages ?? [];
                  if (existing.some((m) => m.id === newMsg.id)) return;
                  cache.writeQuery<MessagesQuery, MessagesVariables>({
                    query: MESSAGES,
                    variables: vars,
                    data: { messages: [...existing, newMsg] },
                  });
                },
              });

              (e.currentTarget as HTMLFormElement).reset();
              scrollToEnd();
            }}
          >
            <Input
              name="body"
              placeholder="Message…"
              className="flex-1"
              autoComplete="off"
              aria-label="Message input"
            />
            <Button type="submit">Send</Button>
          </form>
        )}
      </Card>
    </div>
  );
}

function EmptyState({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl mb-4">{emoji}</div>
        <div className="text-lg font-medium text-gray-900 mb-2">{title}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
    </div>
  );
}

function MessageRow({ msg }: { msg: ChatMessage }) {
  const authorLabel = msg.author?.name || msg.author?.email || 'unknown';

  const time = useMemo(() => {
    try {
      return new Date(msg.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, [msg.createdAt]);

  return (
    <div className="flex space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <Avatar name={authorLabel} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-gray-900">{authorLabel}</span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {msg.body}
        </div>
      </div>
    </div>
  );
}
