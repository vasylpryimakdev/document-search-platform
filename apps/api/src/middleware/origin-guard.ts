import type { RequestHandler } from "express";
import { allowedOrigins } from "../config/cors.js";

export const originGuard: RequestHandler = (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  const origin = req.get("origin");

  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({ message: "Origin is not allowed" });
  }

  return next();
};
