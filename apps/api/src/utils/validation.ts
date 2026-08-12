export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseUserEmail(value: unknown) {
  if (typeof value !== "string" || !isValidEmail(value)) {
    return { error: "Valid userEmail is required" } as const;
  }

  return { value } as const;
}
