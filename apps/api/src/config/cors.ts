import cors from "cors";
import { getCsvEnv } from "./env.js";

export const allowedOrigins = new Set(getCsvEnv("CORS_ALLOWED_ORIGINS"));

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (origin && allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
});
