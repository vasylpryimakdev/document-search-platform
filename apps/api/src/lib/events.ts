import type { Response } from "express";

const clientsByUser = new Map<string, Set<Response>>();

type UserEvent = {
  type: string;
  payload: unknown;
};

export function addUserEventClient(userEmail: string, res: Response) {
  const clients = clientsByUser.get(userEmail) ?? new Set<Response>();
  clients.add(res);
  clientsByUser.set(userEmail, clients);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  sendEvent(res, {
    type: "connected",
    payload: { userEmail },
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25000);

  return () => {
    clearInterval(heartbeat);
    clients.delete(res);

    if (clients.size === 0) {
      clientsByUser.delete(userEmail);
    }
  };
}

export function sendUserEvent(userEmail: string, event: UserEvent) {
  const clients = clientsByUser.get(userEmail);

  if (!clients) {
    return;
  }

  for (const client of clients) {
    sendEvent(client, event);
  }
}

function sendEvent(res: Response, event: UserEvent) {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
}
