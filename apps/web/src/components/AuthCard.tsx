import type { FormEvent } from 'react'

type AuthCardProps = {
  emailInput: string
  error: string
  onEmailInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthCard({ emailInput, error, onEmailInputChange, onSubmit }: AuthCardProps) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">Document Search Platform</p>
        <h1 id="auth-title">Start with your email</h1>
        <p className="auth-copy">
          This demo stores your email locally to emulate authentication before document upload.
        </p>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <label htmlFor="email">Email address</label>
          <input
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
          <button type="submit">Continue</button>
        </form>
      </section>
    </main>
  )
}
