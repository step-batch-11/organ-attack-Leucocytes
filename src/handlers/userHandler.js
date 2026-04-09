import { getCookie } from "hono/cookie";

export const serveUserDetails = (c) => {
  const sessionID = getCookie(c, "sessionID");
  const session = c.get("session");

  if (!(sessionID in session)) {
    return c.json({ success: false });
  }

  const userID = session[sessionID];
  const players = c.get("players");
  const username = players[userID];
  return c.json({ username, success: true });
};
