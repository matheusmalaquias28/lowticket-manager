'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, Loader2, Sparkles, ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Como foi o desempenho de hoje?',
  'Qual o ROAS e ROI de ontem?',
  'Quais campanhas com melhor performance?',
  'Compare receita desta semana com a anterior',
  'Análise completa do dia de hoje',
]

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderText(text: string) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return (
      <span key={i}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-700 text-[#F0F0F8]">{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )}
        {i < arr.length - 1 && <br />}
      </span>
    )
  })
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}
    >
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-[#7C3AED]' : 'bg-[#1A1A24] border border-[#7C3AED40]',
      )}>
        {isUser
          ? <User size={11} className="text-white" />
          : <Sparkles size={11} className="text-[#8B5CF6]" />
        }
      </div>
      <div className={cn(
        'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
        isUser
          ? 'bg-[#7C3AED] text-white rounded-tr-sm'
          : 'bg-[#14141E] border border-[#2A2A3E] text-[#D0D0E0] rounded-tl-sm',
      )}>
        {isUser ? msg.content : renderText(msg.content)}
      </div>
    </motion.div>
  )
}

// ─── Thinking indicator ───────────────────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
      <div className="w-6 h-6 rounded-full bg-[#1A1A24] border border-[#7C3AED40] flex items-center justify-center shrink-0">
        <Sparkles size={11} className="text-[#8B5CF6]" />
      </div>
      <div className="bg-[#14141E] border border-[#2A2A3E] rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2.5">
        <Loader2 size={12} className="text-[#8B5CF6] animate-spin" />
        <span className="text-[12px] text-[#5A5A70] italic">Consultando Utmify...</span>
      </div>
    </motion.div>
  )
}

// ─── Animated top border ──────────────────────────────────────────────────────

function LiveBorder() {
  return (
    <div className="relative h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#22222E]" />
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #7C3AED 30%, #A855F7 50%, #EC4899 70%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  )
}

// ─── MetricsAgent ─────────────────────────────────────────────────────────────

export function MetricsAgent() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-open panel when messages arrive
  useEffect(() => {
    if (messages.length > 0) setPanelOpen(true)
  }, [messages.length])

  useEffect(() => {
    if (panelOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    }
  }, [messages, panelOpen])

  async function send(text?: string) {
    const message = (text ?? input).trim()
    if (!message || loading) return

    const next: Message[] = [...messages, { role: 'user', content: message }]
    setMessages(next)
    setInput('')
    setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/metrics-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      const text = await res.text()
      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: `Erro do servidor (${res.status}). Tente novamente.` }])
        return
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: (!res.ok || data.error) ? `Erro: ${data.error ?? 'Falha ao consultar.'}` : data.text as string,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Não foi possível conectar ao agente.' }])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  const showSuggestions = messages.length === 0 && !loading

  return (
    <div className="shrink-0 relative">
      <LiveBorder />

      {/* Conversation panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 300, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden bg-[#080810] border-b border-[#22222E]"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E2E]">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={13} className="text-[#8B5CF6]" />
                </motion.div>
                <span className="text-xs font-700 text-[#F0F0F8]">Agente de Métricas</span>
                {loading && (
                  <span className="text-[10px] text-[#5A5A70] flex items-center gap-1">
                    <Loader2 size={9} className="animate-spin" /> consultando...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); setPanelOpen(false) }}
                    className="p-1.5 rounded-lg text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#22222E] transition-colors"
                    title="Limpar conversa"
                  >
                    <RotateCcw size={11} />
                  </button>
                )}
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-lg text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#22222E] transition-colors"
                >
                  <ChevronDown size={13} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[calc(300px-44px)] overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {loading && <ThinkingIndicator />}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="bg-[#080810] px-4 pt-3 pb-4 space-y-2.5">

        {/* Suggestion chips */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2 overflow-x-auto scrollbar-none"
            >
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  onClick={() => send(s)}
                  className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-[#2A2A3E] text-[#8080A0] hover:text-[#F0F0F8] hover:border-[#7C3AED70] hover:bg-[#7C3AED12] transition-all whitespace-nowrap"
                >
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-end gap-2.5">

          {/* Pulsing agent orb */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0px 0px #7C3AED00',
                '0 0 10px 2px #7C3AED50',
                '0 0 0px 0px #7C3AED00',
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shrink-0 cursor-pointer"
            onClick={() => messages.length > 0 && setPanelOpen(p => !p)}
            title={messages.length > 0 ? 'Ver conversa' : undefined}
          >
            <Sparkles size={15} className="text-white" />
          </motion.div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
              }}
              disabled={loading}
              rows={1}
              placeholder="Pergunte sobre suas métricas..."
              className={cn(
                'w-full bg-[#111120] rounded-xl px-4 py-2.5 text-sm text-[#F0F0F8]',
                'placeholder:text-[#404060] focus:outline-none resize-none disabled:opacity-50',
                'transition-all duration-200 border',
                input.trim()
                  ? 'border-[#7C3AED80] shadow-[0_0_12px_#7C3AED25]'
                  : 'border-[#2A2A3E] hover:border-[#3A3A55]',
              )}
              style={{ minHeight: '42px', maxHeight: '120px' }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`
              }}
            />
          </div>

          {/* Send button */}
          <motion.button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            whileTap={{ scale: 0.88 }}
            animate={input.trim() && !loading ? {
              boxShadow: [
                '0 0 0px 0px #7C3AED00',
                '0 0 14px 3px #7C3AED60',
                '0 0 0px 0px #7C3AED00',
              ],
            } : { boxShadow: '0 0 0px 0px #7C3AED00' }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] disabled:opacity-30 flex items-center justify-center text-white transition-all shrink-0"
          >
            {loading
              ? <Loader2 size={15} className="animate-spin" />
              : <Send size={14} />
            }
          </motion.button>
        </div>
      </div>
    </div>
  )
}
