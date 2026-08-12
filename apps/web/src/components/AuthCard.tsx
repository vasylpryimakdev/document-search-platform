import type { SubmitEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { displayTitle, eyebrow, pageBackground } from '../styles'
import { useAuthStore } from '../stores/auth-store'

export function AuthCard() {
  const emailInput = useAuthStore((state) => state.emailInput)
  const emailError = useAuthStore((state) => state.emailError)
  const setEmailInput = useAuthStore((state) => state.setEmailInput)
  const submitEmail = useAuthStore((state) => state.submitEmail)

  function handleEmailSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submitEmail()
  }

  return (
    <main className={`${pageBackground} grid place-items-center p-6`}>
      <Card
        className="w-full max-w-[460px] rounded-[28px] border-slate-400/30 bg-slate-950/80 p-7 text-slate-200 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-10"
        aria-labelledby="auth-title"
      >
        <CardHeader className="p-0">
          <p className={eyebrow}>Document Search Platform</p>
          <CardTitle className={displayTitle} id="auth-title">Start with your email</CardTitle>
          <CardDescription className="my-[18px] mb-7 text-slate-300">
            This demo stores your email locally to emulate authentication before document upload.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <form className="grid gap-3" onSubmit={handleEmailSubmit} noValidate>
            <label className="font-bold text-slate-50" htmlFor="email">Email address</label>
            <Input
              className="bg-slate-950/70 text-slate-50"
              id="email"
              type="email"
              value={emailInput}
              placeholder="you@example.com"
              onChange={(event) => setEmailInput(event.target.value)}
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError ? (
              <p className="m-0 text-sm text-red-300" id="email-error">
                {emailError}
              </p>
            ) : null}
            <Button type="submit">Continue</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
