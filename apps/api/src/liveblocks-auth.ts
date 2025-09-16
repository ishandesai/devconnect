import { Liveblocks } from '@liveblocks/node';
export const liveblocks = new Liveblocks({
secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});
export const roomIdForDoc = (docId: string) => `doc:${docId}`;