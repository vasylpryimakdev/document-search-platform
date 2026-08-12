import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type AuthCardProps = {
  emailInput: string
  error: string
  onEmailInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthCard({ emailInput, error, onEmailInputChange, onSubmit }: AuthCardProps) {
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
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <label htmlFor="email">Email address</label>
            <Input
              id="email"
              type="email"
              value={emailInput}
              placeholder="you@example.com"
              onChange={(event) => onEmailInputChange(event.target.value)}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'email-error' : undefined}
            />
            {error ? (
              <p className="field-error" id="email-error">
                {error}
              </p>
            ) : null}
            <Button type="submit">Continue</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
