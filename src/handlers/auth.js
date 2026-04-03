import { getCookie, setCookie } from "hono/cookie";
const hoursToMaxAge = (hour) => 3600 * hour;

export const loginHandler = async (c) => {
  const playerIdGenerator = c.get("playerIdGenerator");
  const idGenerator = c.get("idGenerator");
  const fd = await c.req.formData();
  const username = fd.get("username");
  const roomID = 101;
  const rooms = c.get("rooms");
  const players = rooms[roomID];

  if (username === null || username.trim() === "") {
    return c.json({ message: "invalid username" }, 401);
  }

  const sessionID = idGenerator();
  const session = c.get("session");
  session[sessionID] = username;
  const maxAge = hoursToMaxAge(2);
  setCookie(c, "sessionID", sessionID, { maxAge });
  setCookie(c, "roomID", roomID, { maxAge });
  const player = {
    id: playerIdGenerator(),
    name: username,
    type: (players.length === 0) ? "host" : "non-host",
  };
  players.push(player);
  return c.redirect("/");
};

export const redirectLoggedInUser = (c, next) => {
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");

  return (sessionID in session) ? c.redirect("/") : next();
};

export const allowLoggedInUser = (c, next) => {
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");

  return !(sessionID in session) ? c.redirect("/pages/login.html") : next();
};
