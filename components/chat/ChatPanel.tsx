'use client'

import { useState, useRef, useEffect } from 'react'
import WelcomeScreen from './WelcomeScreen'
import MessageList from './MessageList'
import ChatInputBar from './ChatInputBar'
import { Message } from '@/lib/types'

interface Props {
  started: boolean
  firstMessage: string
  onStart: (msg: string) => void
}

export default function ChatPanel({ started, firstMessage, onStart }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (started && firstMessage && messages.length === 0) {
      const userMsg: Message = {
        id: 'msg-1',
        role: 'user',
        blocks: [{ type: 'text', content: firstMessage }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      const aiMsg: Message = {
        id: 'msg-2',
        role: 'assistant',
        blocks: [{ type: 'text', content: "I'm on it! Let me work through the engineering calculations for you." }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages([userMsg, aiMsg])
    }
  }, [started, firstMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text: string) => {
    if (!text.trim()) return
    const msg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      blocks: [{ type: 'text', content: text }],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, msg])
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-[#f4f4f5]">
      {/* Title */}
      <div className="text-center pt-8 pb-2 shrink-0">
        <span className="text-[22px] font-semibold text-[#111827] tracking-tight">
          Mec<span className="text-[#9ca3af] font-light">AI</span>
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!started ? (
          <WelcomeScreen onSelectPrompt={onStart} />
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInputBar onSend={started ? handleSend : onStart} />
    </div>
  )
}