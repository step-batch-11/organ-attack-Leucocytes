import { getCookie } from "hono/cookie";
import type { Context } from "hono";
import type { AppBindings } from "../types/context.ts";

export const serveUserDetails = (c: Context<AppBindings>) => {
  const sessionID = getCookie(c, "sessionID");
  const session = c.get("session");

  if (sessionID === undefined || !(sessionID in session)) {
    return c.json({ success: false });
  }

  const userID = session[sessionID];
  const players = c.get("players");
  const username = players[userID];
  return c.json({ username, success: true });
};
