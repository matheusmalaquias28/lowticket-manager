'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/kanban')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7C3AED] mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-800 text-[#F0F0F8]">Lowticket Manager</h1>
          <p className="text-sm text-[#9090A8] mt-1">Gerencie suas ofertas semanais</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-500 text-[#9090A8] mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className={cn(
                'w-full px-4 py-3 rounded-xl text-sm text-[#F0F0F8]',
                'bg-[#111118] border border-[#22222E]',
                'focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED20]',
                'placeholder:text-[#5A5A70] transition-colors'
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-500 text-[#9090A8] mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={cn(
                'w-full px-4 py-3 rounded-xl text-sm text-[#F0F0F8]',
                'bg-[#111118] border border-[#22222E]',
                'focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED20]',
                'placeholder:text-[#5A5A70] transition-colors'
              )}
            />
          </div>

          {error && (
            <p className="text-sm text-[#EF4444] bg-[#EF444410] px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full py-3 rounded-xl font-600 text-sm text-white',
              'bg-[#7C3AED] hover:bg-[#8B5CF6]',
              'transition-all duration-150 active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
