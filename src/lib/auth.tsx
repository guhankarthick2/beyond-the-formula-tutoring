import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { authRedirectTo, isSupabaseConfigured, supabase } from './supabase'
import type { Profile } from './types'

type AuthResult = { error: string | null }

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  passwordRecovery: boolean
  clearPasswordRecovery: () => void
  refreshProfile: () => Promise<void>
  signInWithGoogle: () => Promise<AuthResult>
  signInWithGitHub: () => Promise<AuthResult>
  signUpWithPassword: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<AuthResult & { needsEmailConfirmation?: boolean }>
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>
  resetPasswordForEmail: (email: string) => Promise<AuthResult>
  updatePassword: (newPassword: string) => Promise<AuthResult>
  updateDisplayName: (displayName: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  isApprovedTutor: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const notConfigured: AuthResult = {
  error: 'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
}

function friendlyAuthError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email before signing in. Check your inbox for the link.'
  }
  if (lower.includes('user already registered')) {
    return 'An account with that email already exists. Sign in instead.'
  }
  if (lower.includes('password')) {
    return message
  }
  return message
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error(error)
    return null
  }
  return data as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  const clearPasswordRecovery = useCallback(() => {
    setPasswordRecovery(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    const next = await fetchProfile(session.user.id)
    setProfile(next)
  }, [session?.user])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, next) => {
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
      if (event === 'SIGNED_OUT') {
        setPasswordRecovery(false)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    void fetchProfile(session.user.id).then(setProfile)
  }, [session?.user])

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return notConfigured
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authRedirectTo('auth'),
        queryParams: { prompt: 'select_account' },
      },
    })
    return { error: error ? friendlyAuthError(error.message) : null }
  }, [])

  const signInWithGitHub = useCallback(async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return notConfigured
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: authRedirectTo('auth'),
        // Ask GitHub to show the authorization step again (does not always show account picker).
        queryParams: { prompt: 'consent' },
      },
    })
    return { error: error ? friendlyAuthError(error.message) : null }
  }, [])

  const signUpWithPassword = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
    ): Promise<AuthResult & { needsEmailConfirmation?: boolean }> => {
      if (!isSupabaseConfigured) return notConfigured
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: authRedirectTo('auth'),
        },
      })
      if (error) return { error: friendlyAuthError(error.message) }
      const needsEmailConfirmation = !data.session
      return { error: null, needsEmailConfirmation }
    },
    [],
  )

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return notConfigured
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { error: error ? friendlyAuthError(error.message) : null }
  }, [])

  const resetPasswordForEmail = useCallback(async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return notConfigured
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirectTo('auth'),
    })
    return { error: error ? friendlyAuthError(error.message) : null }
  }, [])

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return notConfigured
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setPasswordRecovery(false)
    return { error: error ? friendlyAuthError(error.message) : null }
  }, [])

  const updateDisplayName = useCallback(
    async (displayName: string): Promise<AuthResult> => {
      if (!isSupabaseConfigured) return notConfigured
      if (!session?.user) return { error: 'You must be signed in to update your display name.' }
      const name = displayName.trim()
      if (name.length < 2 || name.length > 40) {
        return { error: 'Display name must be between 2 and 40 characters.' }
      }
      const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', session.user.id)
      if (error) return { error: friendlyAuthError(error.message) }
      await refreshProfile()
      return { error: null }
    },
    [session?.user, refreshProfile],
  )

  const signOut = useCallback(async () => {
    // End this browser session and revoke refresh tokens so the app is fully signed out.
    // Provider sites (GitHub/Google) keep their own cookies — see auth page tip to switch accounts.
    await supabase.auth.signOut({ scope: 'global' })
    setSession(null)
    setProfile(null)
    setPasswordRecovery(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      passwordRecovery,
      clearPasswordRecovery,
      refreshProfile,
      signInWithGoogle,
      signInWithGitHub,
      signUpWithPassword,
      signInWithPassword,
      resetPasswordForEmail,
      updatePassword,
      updateDisplayName,
      signOut,
      isApprovedTutor:
        profile?.tutor_status === 'approved' &&
        (profile.role === 'tutor' || profile.role === 'admin'),
      isAdmin: profile?.role === 'admin',
    }),
    [
      loading,
      session,
      profile,
      passwordRecovery,
      clearPasswordRecovery,
      refreshProfile,
      signInWithGoogle,
      signInWithGitHub,
      signUpWithPassword,
      signInWithPassword,
      resetPasswordForEmail,
      updatePassword,
      updateDisplayName,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
