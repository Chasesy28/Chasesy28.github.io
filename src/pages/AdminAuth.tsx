import { useEffect, useState } from 'react'
import { ArrowRight, Loader2, LogIn, ShieldCheck, ShieldX } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authManager } from '@/lib/admin-auth'

type AuthState = 'checking' | 'signedIn' | 'signedOut' | 'unauthorized' | 'error'

function AdminAuthPage() {
  const navigate = useNavigate()
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [email, setEmail] = useState('')
  const [details, setDetails] = useState('')

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        const existingSession = authManager.getSession()
        if (existingSession) {
          setEmail(existingSession.email)
        }

        const admin = await authManager.initializeAuthFromSupabase()
        if (!isMounted) return

        if (admin) {
          const session = authManager.getSession()
          setEmail(session?.email ?? admin.email)
          setAuthState('signedIn')
          return
        }

        setAuthState('signedOut')
      } catch (error) {
        if (!isMounted) return

        const message = error instanceof Error ? error.message : 'Unable to validate this session.'
        setDetails(message)
        setAuthState(message.toLowerCase().includes('not authorized') ? 'unauthorized' : 'error')
      }
    }

    void checkSession()

    return () => {
      isMounted = false
    }
  }, [])

  const primaryAction =
    authState === 'signedIn'
      ? { label: 'Open dashboard', href: '/vite/admin' }
      : { label: 'Go to login', href: '/admin' }

  const titleByState: Record<AuthState, string> = {
    checking: 'Checking your session',
    signedIn: 'Access granted',
    signedOut: 'Sign-in required',
    unauthorized: 'Access blocked',
    error: 'Session check failed',
  }

  const descriptionByState: Record<AuthState, string> = {
    checking: 'We are verifying your Supabase session before sending you onward.',
    signedIn: 'You are authenticated and can continue to the admin dashboard.',
    signedOut: 'No authenticated session was found, so this page stays on the login path.',
    unauthorized: 'Your Google account signed in successfully, but it is not allowed to access admin tools.',
    error: 'Something went wrong while checking the session. Try signing in again.',
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(135deg,_#f8fafc_0%,_#eff6ff_45%,_#ffffff_100%)] px-4 py-10 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] dark:text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <Card className="w-full overflow-hidden border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-slate-200/80 bg-slate-950 px-8 py-10 text-white lg:border-b-0 lg:border-r dark:border-slate-800">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-medium text-sky-100">
                <ShieldCheck className="h-4 w-4" />
                Admin redirect checkpoint
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">{titleByState[authState]}</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                {descriptionByState[authState]}
              </p>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                <p className="font-medium text-white">What happens here</p>
                <p className="mt-2 leading-6">
                  This route is the OAuth callback target. It gives you a visible handoff screen that changes depending on whether the session exists.
                </p>
              </div>
            </div>

            <div className="p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl text-slate-900 dark:text-slate-50">
                  {authState === 'signedIn' ? 'Welcome back' : 'Admin access'}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {authState === 'signedIn'
                    ? 'Your session is ready and the dashboard is unlocked.'
                    : 'Continue to the login flow or return to the dashboard if you already have access.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 px-0 pb-0">
                <div
                  className={`rounded-2xl border p-4 ${
                    authState === 'signedIn'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
                      : authState === 'unauthorized'
                        ? 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100'
                        : authState === 'error'
                          ? 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
                          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {authState === 'signedIn' ? (
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : authState === 'signedOut' ? (
                      <LogIn className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                      <ShieldX className="mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {authState === 'signedIn'
                          ? `Signed in as ${email || 'unknown user'}`
                          : authState === 'signedOut'
                            ? 'No signed-in session was found.'
                            : authState === 'unauthorized'
                              ? 'Signed in, but not allowed here.'
                              : authState === 'error'
                                ? 'Unable to confirm your session.'
                                : 'Verifying Supabase session...'}
                      </p>
                      {details ? <p className="mt-2 text-sm leading-6">{details}</p> : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => navigate(primaryAction.href)}
                    className="sm:flex-1"
                    disabled={authState === 'checking'}
                  >
                    {authState === 'checking' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        {primaryAction.label}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <Button asChild variant="outline" className="sm:flex-1">
                    <Link to="/">Back to home</Link>
                  </Button>
                </div>

                {authState !== 'signedIn' ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    If you just finished signing in, this page will stay here only if the session was rejected or the callback has not completed.
                  </p>
                ) : null}
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminAuthPage
