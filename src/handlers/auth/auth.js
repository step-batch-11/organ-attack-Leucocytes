import { getCookie, setCookie } from "hono/cookie";

const ONE_HOUR_IN_SEC = 3600;
const cookieAgeInSec = (hour) => ONE_HOUR_IN_SEC * hour;

const getUsername = async (c) => {
  const payload = await c.req.formData();
  const username = payload.get("username");
  return username.trim();
};

const createPlayer = (c, name, players) => {
  const generatePlayerID = c.get("playerIDGenerator");

  return {
    id: generatePlayerID(),
    name,
    type: (players.length === 0) ? "host" : "non-host",
  };
};

const createSessionID = (c) => {
  const generateSessionID = c.get("idGenerator");
  const sessionID = generateSessionID();
  return sessionID;
};

export const getPlayers = (c, roomID) => {
  const rooms = c.get("rooms");
  const players = rooms[roomID];
  return players;
};

export const setAuthCookies = (c, sessionID) => {
  const maxAge = cookieAgeInSec(2);
  setCookie(c, "sessionID", sessionID, { maxAge });
  const roomID = 101;
  setCookie(c, "roomID", roomID, { maxAge });
  return roomID;
};

export const loginHandler = async (c) => {
  const username = await getUsername(c);
  const isUsernameValid = username === null || username === "";

  if (isUsernameValid) {
    return c.json({ message: "invalid username" }, 401);
  }

  const sessionID = createSessionID(c);
  const sessions = c.get("session");
  const sanitizedUsername = username.trim().slice(0, 8);
  sessions[sessionID] = sanitizedUsername;

  const roomID = setAuthCookies(c, sessionID);

  const players = getPlayers(c, roomID);
  const player = createPlayer(c, sanitizedUsername, players);
  players.push(player);

  return c.redirect("/");
};

const redirectLoggedInUser = (c, next) => {
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");

  if (sessionID in session) {
    return c.redirect("/");
  }

  return next();
};

const allowLoggedInUser = (c, next) => {
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");

  if (!(sessionID in session)) {
    return c.redirect("/pages/login.html");
  }

  return next();
};

export { allowLoggedInUser, redirectLoggedInUser };
