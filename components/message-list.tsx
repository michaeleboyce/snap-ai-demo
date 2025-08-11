"use client";

import { useRef, useEffect } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: ChatMessage[];
  showTimestamps?: boolean;
  autoScroll?: boolean; // default false per request
}

export default function MessageList({ messages, showTimestamps = true, autoScroll = false }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoScroll) return;
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, autoScroll]);

  return (
    <div ref={containerRef} className="h-[520px] overflow-y-auto px-6 py-4 space-y-4">
      {messages.map((message, index) => (
        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ring-1 ring-slate-900/5 ${
              message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            {showTimestamps && (
              <p className={`text-[10px] mt-1 opacity-70 ${message.role === 'user' ? 'text-blue-50' : 'text-slate-500'}`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


