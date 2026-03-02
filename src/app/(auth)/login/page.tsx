'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Sending magic link...')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined },
    })
    setStatus(error ? `Error: ${error.message}` : 'Check your email for login link.')
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>
      <form onSubmit={signIn} className="space-y-3">
        <input className="w-full border rounded p-2" type="email" required placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">Send magic link</button>
      </form>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </main>
  )
}
