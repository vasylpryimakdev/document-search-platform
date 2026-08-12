import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '../stores/auth-store'

export function AuthCard() {
  const emailInput = useAuthStore((state) => state.emailInput)
  const emailError = useAuthStore((state) => state.emailError)
  const setEmailInput = useAuthStore((state) => state.setEmailInput)
  const submitEmail = useAuthStore((state) => state.submitEmail)

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitEmail()
  }

  return (
    <main className="auth-page">
      <Card className="auth-card" aria-labelledby="auth-title">
        <CardHeader className="p-0">
          <p className="eyebrow">Document Search Platform</p>
          <CardTitle id="auth-title">Start with your email</CardTitle>
          <CardDescription className="auth-copy">
            This demo stores your email locally to emulate authentication before document upload.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
            <label htmlFor="email">Email address</label>
            <Input
              id="email"
              type="email"
              value={emailInput}
              placeholder="you@example.com"
              onChange={(event) => setEmailInput(event.target.value)}
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError ? (
              <p className="field-error" id="email-error">
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
