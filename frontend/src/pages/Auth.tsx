import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Mail,
  Key,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
  LogIn,
} from 'lucide-react'

type AuthView = 'landing' | 'login' | 'signup' | 'signup-otp'

const inputClass =
  'block w-full pl-11 pr-4 py-3 bg-rose-50/60 border border-rose-200 text-stone-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 transition-all text-sm'

export const Auth: React.FC = () => {
  const navigate = useNavigate()
  const { user, signInWithPassword, signUp, verifySignupOtp, resendSignupOtp } = useAuth()

  const [view, setView] = useState<AuthView>('landing')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const resetMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const switchView = (next: AuthView) => {
    resetMessages()
    setView(next)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    resetMessages()

    const { error: loginError } = await signInWithPassword(email, password)

    setLoading(false)
    if (loginError) {
      setError(loginError.message || 'Invalid email or password.')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    const mobileDigits = mobile.replace(/\D/g, '')
    if (mobileDigits.length < 10 || mobileDigits.length > 15) {
      setError('Enter a valid mobile number (10–15 digits).')
      return
    }

    setLoading(true)
    resetMessages()

    const { error: signUpError, needsOtp } = await signUp({ name, mobile, email, password })

    setLoading(false)
    if (signUpError) {
      setError(signUpError.message || 'Sign up failed. Please try again.')
    } else if (needsOtp) {
      setSuccessMessage('We sent a 6-digit OTP to your email. Enter it below to complete registration.')
      setView('signup-otp')
    } else {
      setSuccessMessage('Account created successfully! Redirecting to your dashboard...')
    }
  }

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    resetMessages()

    const { error: verifyError } = await verifySignupOtp(email, otp, { name, mobile })

    setLoading(false)
    if (verifyError) {
      setError(verifyError.message || 'Invalid or expired OTP. Please try again.')
    } else {
      setSuccessMessage('Account created successfully!')
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    resetMessages()

    const { error: resendError } = await resendSignupOtp(email)

    setLoading(false)
    if (resendError) {
      setError(resendError.message || 'Could not resend OTP.')
    } else {
      setSuccessMessage('A new OTP has been sent to your email.')
    }
  }

  const subtitle = {
    landing: 'Sign in to shop, track orders, and manage your account.',
    login: 'Welcome back! Enter your credentials to continue.',
    signup: 'Create your NovaCart account in a few steps.',
    'signup-otp': 'Verify your email to activate your account.',
  }[view]

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-rose-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-pink-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex bg-gradient-to-tr from-rose-400 to-purple-600 p-3 rounded-2xl shadow-xl shadow-rose-400/25 mb-4">
            <Sparkles className="w-8 h-8 text-stone-900" />
          </Link>
          <h2 className="font-display font-extrabold text-3xl text-stone-900 tracking-tight">
            Welcome to NovaCart
          </h2>
          <p className="mt-2 text-sm text-stone-500">{subtitle}</p>
        </div>

        <div className="bg-white/60 border border-rose-200/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          {successMessage && !error && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              {successMessage}
            </div>
          )}

          {view === 'landing' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-400/20 flex items-center justify-center space-x-2 group"
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-center text-xs text-stone-400">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="text-rose-300 hover:text-rose-300 font-medium"
                >
                  Create an account
                </button>
              </p>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    id="login-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    id="login-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-400/20 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </button>

              <p className="text-center text-xs text-stone-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="text-rose-300 hover:text-rose-300 font-medium"
                >
                  Create account
                </button>
              </p>

              <button
                type="button"
                onClick={() => switchView('landing')}
                className="w-full text-xs text-stone-400 hover:text-stone-700"
              >
                ← Back
              </button>
            </form>
          )}

          {view === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="signup-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-mobile" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    id="signup-mobile"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^\d+\s-]/g, ''))}
                    placeholder="9876543210"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    id="signup-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    id="signup-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-400/20 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account & Send OTP'}
              </button>

              <p className="text-center text-xs text-stone-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-rose-300 hover:text-rose-300 font-medium"
                >
                  Login
                </button>
              </p>

              <button
                type="button"
                onClick={() => switchView('landing')}
                className="w-full text-xs text-stone-400 hover:text-stone-700"
              >
                ← Back
              </button>
            </form>
          )}

          {view === 'signup-otp' && (
            <form onSubmit={handleVerifySignupOtp} className="space-y-5">
              <p className="text-xs text-stone-500 text-center">
                OTP sent to <span className="text-stone-800 font-medium">{email}</span>
              </p>

              <div>
                <label htmlFor="signup-otp" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Email OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="signup-otp"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className={`${inputClass} tracking-[0.25em] text-center font-mono font-bold text-lg pl-4`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-400/20 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Register'}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-rose-50/40 border border-rose-200/80 text-stone-700 hover:bg-rose-100/40 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </button>

              <button
                type="button"
                onClick={() => switchView('signup')}
                className="w-full text-xs text-stone-400 hover:text-stone-700"
              >
                ← Back to sign up
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
