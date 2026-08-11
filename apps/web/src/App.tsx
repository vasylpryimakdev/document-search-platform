import { useState, type FormEvent } from 'react'
import './App.css'

const USER_EMAIL_STORAGE_KEY = 'document-search:user-email'

function App() {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem(USER_EMAIL_STORAGE_KEY) ?? '')
  const [emailInput, setEmailInput] = useState(userEmail)
  const [error, setError] = useState('')

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = emailInput.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address')
      return
    }

    localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalizedEmail)
    setUserEmail(normalizedEmail)
    setError('')
  }

  function handleSignOut() {
    localStorage.removeItem(USER_EMAIL_STORAGE_KEY)
    setUserEmail('')
    setEmailInput('')
    setError('')
  }

  if (!userEmail) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="auth-title">
          <p className="eyebrow">Document Search Platform</p>
          <h1 id="auth-title">Start with your email</h1>
          <p className="auth-copy">
            This demo stores your email locally to emulate authentication before document upload.
          </p>

          <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={emailInput}
              placeholder="you@example.com"
              onChange={(event) => setEmailInput(event.target.value)}
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

  return (
    <main className="documents-page">
      <header className="documents-header">
        <div>
          <p className="eyebrow">Signed in as</p>
          <h1>{userEmail}</h1>
        </div>
        <button className="secondary-button" type="button" onClick={handleSignOut}>
          Change email
        </button>
      </header>

      <section className="documents-panel">
        <div>
          <h2>Your documents</h2>
          <p>Upload, indexing status, search, and delete controls will be added next.</p>
        </div>
        <button type="button">Upload</button>
      </section>
    </main>
  )
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default App
