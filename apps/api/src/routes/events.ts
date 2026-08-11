import { Router } from "express";
import { addUserEventClient } from "../lib/events.js";

export const eventsRouter = Router();

eventsRouter.get("/", (req, res) => {
  const { userEmail } = req.query;

  if (typeof userEmail !== "string" || !isValidEmail(userEmail)) {
    return res.status(400).json({ message: "Valid userEmail is required" });
  }

  const removeClient = addUserEventClient(userEmail, res);

  req.on("close", removeClient);
});

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
