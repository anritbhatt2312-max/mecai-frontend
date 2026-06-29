'use client'

import { Message } from '@/lib/types'

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[75%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed
              ${msg.role === 'user'
                ? 'bg-[#1d4ed8] text-white rounded-br-sm'
                : 'bg-white text-[#111827] border border-[#e5e7eb] rounded-bl-sm shadow-sm'
              }`}
          >
            {msg.blocks.map((block, i) => (
              block.type === 'text' ? (
                <p key={i}>{block.content}</p>
              ) : null
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}