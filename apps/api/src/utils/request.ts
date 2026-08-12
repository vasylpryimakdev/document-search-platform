import type { Request } from "express";
import { parseUserEmail } from "./validation.js";

export function getUserEmail(req: Request) {
  return parseUserEmail(req.query.userEmail);
}

export function getRequiredParam(req: Request, name: string) {
  const value = req.params[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    return { error: `${name} is required` } as const;
  }

  return { value } as const;
}

export function getRequiredQueryString(req: Request, name: string) {
  const value = req.query[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    return { error: `${name} is required` } as const;
  }

  return { value: value.trim() } as const;
}
