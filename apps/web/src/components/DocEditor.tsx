'use client';
import { useState } from 'react';

export function DocEditor({ docId }:{ docId:string | null }){
  const [content, setContent] = useState('');
  return (
    <div className="flex-1 p-4">
      {docId ? (
        <textarea value={content} onChange={(e)=>setContent(e.target.value)} className="w-full h-[70vh] border p-2" placeholder="(Static editor stub — CRDT coming later)"/>
      ) : (
        <p className="text-sm text-gray-500">Select a document</p>
      )}
    </div>
  );
}