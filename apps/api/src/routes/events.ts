import { Router } from "express";
import { streamUserEvents } from "../controllers/events-controller.js";

export const eventsRouter = Router();

eventsRouter.get("/", streamUserEvents);
