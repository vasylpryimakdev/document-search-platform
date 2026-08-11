type DocumentsHeaderProps = {
  userEmail: string
  onSignOut: () => void
}

export function DocumentsHeader({ userEmail, onSignOut }: DocumentsHeaderProps) {
  return (
    <header className="documents-header">
      <div>
        <p className="eyebrow">Signed in as</p>
        <h1>{userEmail}</h1>
      </div>
      <button className="secondary-button" type="button" onClick={onSignOut}>
        Change email
      </button>
    </header>
  )
}
