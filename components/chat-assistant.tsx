"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react"

type Role = "student" | "staff" | "hod"
type Message = { id: number; content: string; from: "user" | "assistant" }

const suggestions: Record<Role, string[]> = {
  student: ["How do I request pre-approval?", "Why is a subject pending?", "How is final status decided?"],
  staff: ["How do I update marks?", "How do I review approvals?", "What does cleared mean?"],
  hod: ["How do I create a class?", "How do I assign an advisor?", "How do I process approvals?"],
}

const greetings: Record<Role, string> = {
  student: "Hi! Ask me about your subjects, marks, approvals, or no-due status.",
  staff: "Hi! Ask me about student marks, attendance, approvals, or clearance.",
  hod: "Hi! Ask me about classes, subjects, assignments, or approvals.",
}

export function ChatAssistant({ role }: { role: Role }) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const nextMessageId = useRef(0)
  const transcriptEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(message: string) {
    const content = message.trim()
    if (!content || loading) return

    setInput("")
    setError("")
    setNotice("")
    setMessages((current) => [
      ...current,
      { id: nextMessageId.current++, content, from: "user" },
    ])
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })
      const result: { reply?: string; error?: string; notice?: string } = await response.json()

      if (!response.ok || !result.reply) {
        throw new Error(result.error || "The assistant could not answer right now.")
      }

      const reply = result.reply
      setNotice(result.notice || "")
      setMessages((current) => [
        ...current,
        { id: nextMessageId.current++, content: reply, from: "assistant" },
      ])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The assistant could not answer right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <section
          aria-label="No Due help chat"
          className="mb-3 flex h-[min(36rem,calc(100svh-6rem))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-slate-900/20"
        >
          <header className="flex items-center justify-between border-b bg-gradient-to-r from-violet-600 via-violet-600 to-blue-600 px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-white/15">
                <Sparkles aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">No Due Assistant</h2>
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Academic help · {role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length ? (
                <button
                  type="button"
                  aria-label="Clear conversation"
                  onClick={() => {
                    setMessages([])
                    setError("")
                    setNotice("")
                  }}
                  className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
          </header>

          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-violet-50/50 to-background p-4"
          >
            <div className="flex items-start gap-2">
              <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
                <Bot aria-hidden="true" className="size-4" />
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm border bg-card px-3.5 py-2.5 text-sm shadow-sm">
                {greetings[role]}
              </div>
            </div>
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-2 ${message.from === "user" ? "justify-end" : ""}`}>
                {message.from === "assistant" ? (
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
                    <Bot aria-hidden="true" className="size-4" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                    message.from === "user"
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm border bg-card shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading ? (
              <p role="status" className="ml-9 text-sm text-muted-foreground">Assistant is thinking…</p>
            ) : null}
            {notice ? (
              <p role="status" className="ml-9 rounded-xl border bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
                {notice}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="ml-9 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div ref={transcriptEnd} />
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2 px-4 pb-3">
              {suggestions[role].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  disabled={loading}
                  className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-left text-xs text-violet-800 transition-colors hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage(input)
            }}
            className="flex gap-2 border-t bg-card p-3"
          >
            <input
              aria-label="Ask a question"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              placeholder="Ask a question..."
              className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-primary p-2.5 text-primary-foreground transition-opacity disabled:opacity-50"
            >
              <Send aria-hidden="true" className="size-4" />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        aria-label={isOpen ? "Close help chat" : "Open help chat"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="ml-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-900/25 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
      >
        {isOpen ? <X aria-hidden="true" className="size-6" /> : <MessageCircle aria-hidden="true" className="size-6" />}
      </button>
    </div>
  )
}
