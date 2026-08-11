export const USER_EMAIL_STORAGE_KEY = 'document-search:user-email'

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
