import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const { signInAsGuest } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  function handleGuest() {
    signInAsGuest()
    navigate('/')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="w-full max-w-[360px]">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] mb-3"
            style={{ backgroundColor: '#1A56DB' }}
          >
            <span className="text-white text-[16px]" style={{ fontWeight: 700 }}>R</span>
          </div>
          <div className="text-[20px]" style={{ color: '#111827', fontWeight: 600 }}>
            RunwayIQ
          </div>
          <div className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>
            AI-powered financial intelligence
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-6">
          <div className="text-[14px] mb-5" style={{ color: '#374151', fontWeight: 500 }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] mb-1.5" style={{ color: '#374151', fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
                style={{ color: '#374151' }}
              />
            </div>

            <div>
              <label className="block text-[11px] mb-1.5" style={{ color: '#374151', fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
                style={{ color: '#374151' }}
              />
            </div>

            {error && (
              <div
                className="px-3 py-2 rounded-md text-[11px]"
                style={{ backgroundColor: '#FFF5F5', color: '#E24B4A', border: '1px solid #FCA5A5' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md text-white text-[12px] transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#1A56DB', fontWeight: 500 }}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center text-[11px]" style={{ color: '#9CA3AF' }}>
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null) }}
                  className="underline"
                  style={{ color: '#1A56DB' }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(null) }}
                  className="underline"
                  style={{ color: '#1A56DB' }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Guest access */}
        <div className="mt-3 text-center">
          <button
            onClick={handleGuest}
            className="w-full py-2 rounded-[10px] text-[12px] border transition-colors"
            style={{
              backgroundColor: 'transparent',
              borderColor: '#E5E7EB',
              color: '#6B7280',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            }}
          >
            Continue as Guest — explore with demo data
          </button>
          <p className="mt-2 text-[10px]" style={{ color: '#D1D5DB' }}>
            No account needed · read-only demo · works offline
          </p>
        </div>
      </div>
    </div>
  )
}
