import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  is_admin: boolean
  created_at: string
}

export interface SignUpData {
  name: string
  mobile: string
  email: string
  password: string
}

interface SignUpResult {
  error: Error | null
  needsEmailConfirmation: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (data: SignUpData) => Promise<SignUpResult>
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  getAuthHeaders: () => Promise<Record<string, string>>
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: Profile | null; error: Error | null }>
  refreshProfile: () => Promise<void>
}

const EMAIL_SEND_ERROR =
  'Supabase could not send the confirmation email. Fix: Supabase Dashboard → Authentication → Providers → Email → turn OFF "Confirm email", save, then sign up again. (You can re-enable OTP emails later after configuring SMTP.)'

function parseSignUpError(error: { message?: string; status?: number; name?: string }): string {
  const msg = error.message?.toLowerCase() ?? ''
  if (msg.includes('database error')) {
    return 'Database trigger failed. Re-run backend/fix_signup_trigger.sql in Supabase SQL Editor.'
  }
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'This email is already registered. Try logging in instead.'
  }
  if (msg.includes('email') && msg.includes('send')) {
    return EMAIL_SEND_ERROR
  }
  if (error.status === 500 || error.name === 'AuthRetryableFetchError') {
    return EMAIL_SEND_ERROR
  }
  return error.message || 'Sign up failed. Please try again.'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile from DB:', error.message)
      } else {
        setProfile(data)
      }
    } catch (e) {
      console.error('Unexpected profile fetch error:', e)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? new Error(error.message) : null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') }
    }
  }

  const signUp = async ({ name, mobile, email, password }: SignUpData): Promise<SignUpResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: mobile.replace(/\D/g, ''),
          },
        },
      })

      if (error) {
        console.error('Supabase signUp error:', error)
        return { error: new Error(parseSignUpError(error)), needsEmailConfirmation: false }
      }

      // Check if user already exists (when Email Enumeration Protection is ON)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
          error: new Error('This email is already registered. Try logging in instead.'),
          needsEmailConfirmation: false,
        }
      }

      // Confirm email OFF → user gets a session immediately (no verification step)
      if (data.session) {
        return { error: null, needsEmailConfirmation: false }
      }

      // Confirm email ON → Verification Link sent, wait for verification
      if (data.user) {
        return { error: null, needsEmailConfirmation: true }
      }

      return { error: null, needsEmailConfirmation: false }
    } catch (err) {
      console.error('Supabase signUp exception:', err)
      const authErr = err as { message?: string; status?: number; name?: string }
      return {
        error: new Error(parseSignUpError(authErr)),
        needsEmailConfirmation: false,
      }
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      return { error: error ? new Error(error.message) : null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to resend verification email') }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      return { error: error ? new Error(error.message) : null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign out failed') }
    }
  }

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (currentSession?.access_token) {
      headers['Authorization'] = `Bearer ${currentSession.access_token}`
    }
    return headers
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const updateProfile = async (
    updates: Partial<Profile>
  ): Promise<{ data: Profile | null; error: Error | null }> => {
    try {
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Update via Supabase (syncs with RLS on profiles table)
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      setProfile(data as Profile)
      return { data: data as Profile, error: null }
    } catch (err) {
      console.error('Error updating profile:', err)
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to update profile'),
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithPassword,
        signUp,
        resendVerificationEmail,
        signOut,
        getAuthHeaders,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
