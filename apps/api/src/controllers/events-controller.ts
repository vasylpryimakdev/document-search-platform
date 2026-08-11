import type { RequestHandler } from "express";
import { addUserEventClient } from "../lib/events.js";
import { isValidEmail } from "../utils/validation.js";

export const streamUserEvents: RequestHandler = (req, res) => {
  const { userEmail } = req.query;

  if (typeof userEmail !== "string" || !isValidEmail(userEmail)) {
    return res.status(400).json({ message: "Valid userEmail is required" });
  }

  const removeClient = addUserEventClient(userEmail, res);

  req.on("close", removeClient);
};
