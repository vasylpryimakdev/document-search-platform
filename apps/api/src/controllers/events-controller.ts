import type { RequestHandler } from "express";
import { addUserEventClient } from "../lib/events.js";
import { getUserEmail } from "../utils/request.js";

export const streamUserEvents: RequestHandler = (req, res) => {
  const userEmail = getUserEmail(req);

  if ("error" in userEmail) {
    return res.status(400).json({ message: userEmail.error });
  }

  const removeClient = addUserEventClient(userEmail.value, res);

  req.on("close", removeClient);
};
