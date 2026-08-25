'use client'

import { useState } from 'react'
import { ArrowUp, Paperclip } from 'lucide-react'

export default function ChatInputBar({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim()) return
    onSend(value)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-6 pb-6 pt-3 shrink-0">
      <div className="flex items-center gap-3 bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3 shadow-sm focus-within:border-[#93c5fd] transition-colors">
        <button className="text-[#9ca3af] hover:text-[#6b7280] transition-colors cursor-pointer">
          <Paperclip size={16} />
        </button>

        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Whats next?"
          className="flex-1 bg-transparent outline-none text-[13px] text-[#111827] placeholder-[#9ca3af]"
        />

        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className="w-8 h-8 rounded-xl bg-[#2563eb] flex items-center justify-center text-white hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
        >
          <ArrowUp size={15} />
        </button>
      </div>
    </div>
  )
}