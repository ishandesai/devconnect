declare module 'y-websocket/bin/utils' {
  import { IncomingMessage } from 'http'
  import { WebSocket } from 'ws'
  export function setupWSConnection(
    ws: WebSocket,
    req: IncomingMessage,
    opts?: { maxAwarenessUpdates?: number; docName?: string }
  ): void
}