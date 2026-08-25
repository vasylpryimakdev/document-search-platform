export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseUserEmail(value: unknown) {
  if (typeof value !== "string") {
    return { error: "Valid userEmail is required" } as const;
  }

  const normalizedEmail = value.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return { error: "Valid userEmail is required" } as const;
  }

  return { value: normalizedEmail } as const;
}
