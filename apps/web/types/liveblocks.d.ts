// apps/web/types/liveblocks.d.ts
// Strongly type Presence, Storage, Events, User info, Threads, Room info
// Ref: https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data

import type { LiveList, LiveMap } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    // Real-time per-user presence (for useMyPresence/useOthers)
    Presence: {
      cursor: { x: number; y: number } | null;
      selection?: { from: number; to: number } | null;
    };

    // CRDT room storage (for useStorage/useMutation)
    Storage: {
      docTitle: string;
      outline: LiveList<{ id: string; text: string }>;
      meta: LiveMap<string, string>;
    };

    // Set via auth endpoint (shows up in useSelf/useUser/useOthers info)
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
        color?: string;
        email?: string;
      };
    };

    // Broadcastable events (useBroadcastEvent/useEventListener)
    RoomEvent:
      | { type: "PLAY" }
      | { type: "REACTION"; emoji: "🔥" | "👍" | "🎉" | "❤️" }
      | { type: "PING"; at: number };

    // Custom metadata on comment threads
    ThreadMetadata: {
      sectionId?: string;
      resolved?: boolean;
    };

    // Optional room directory info (resolveRoomsInfo / useRoomInfo)
    RoomInfo: {
      title: string;
      url: string;
    };
  }
}

export {};
