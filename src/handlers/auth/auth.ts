import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context, Next } from "hono";
import type { AppBindings } from "../../types/context.ts";

type AppContext = Context<AppBindings>;

const ONE_HOUR_IN_SEC = 3600;
const cookieAgeInSec = (hour: number) => ONE_HOUR_IN_SEC * hour;

const getUsername = async (c: AppContext): Promise<string> => {
  const payload = await c.req.formData();
  // Cast preserves broken state: a missing "username" field would already
  // throw here (`.trim()` on null) before the caller's null check below.
  const username = payload.get("username") as string;
  return username.trim();
};

const createSessionID = (c: AppContext): string => {
  const generateSessionID = c.get("idGenerator");
  return generateSessionID();
};

export const getPlayers = (c: AppContext, roomID: string) => {
  const rooms = c.get("rooms");
  return rooms[roomID].players;
};

export const setAuthCookies = (c: AppContext, sessionID: string) => {
  const maxAge = cookieAgeInSec(2);
  setCookie(c, "sessionID", sessionID, { maxAge });
};

export const logoutHandler = (c: AppContext) => {
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");

  if (sessionID !== undefined) {
    const playerID = session[sessionID];
    const players = c.get("players");
    delete players[playerID];
  }

  deleteCookie(c, "sessionID");
  return c.redirect("/");
};

export const loginHandler = async (c: AppContext) => {
  const username = await getUsername(c);
  const isUsernameValid = username === "";

  if (isUsernameValid) {
    return c.json({ message: "invalid username" }, 401);
  }

  const sessionID = createSessionID(c);
  const sessions = c.get("session");
  const playerIDGenerator = c.get("playerIDGenerator");
  const players = c.get("players");

  const id = playerIDGenerator();
  sessions[sessionID] = id;

  const sanitizedUsername = username.trim().slice(0, 8);
  players[id] = sanitizedUsername;

  setAuthCookies(c, sessionID);
  return c.redirect("/");
};

const redirectLoggedInUser = (c: AppContext, next: Next) => {
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");

  if (sessionID !== undefined && sessionID in session) {
    return c.redirect("/home_page.html");
  }

  return next();
};

const allowLoggedInUser = (c: AppContext, next: Next) => {
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");

  if (sessionID === undefined || !(sessionID in session)) {
    return c.redirect("/pages/login.html");
  }

  return next();
};

export { allowLoggedInUser, redirectLoggedInUser };
