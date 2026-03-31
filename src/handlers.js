import { getCookie, setCookie } from "hono/cookie";

export const getPlayers = (c) => {
  const rooms = c.get("rooms");
  const roomID = getCookie(c, "roomID");
  const players = rooms[roomID];
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");
  const myId = players.find((player) => player.name === session[sessionID]).id;

  if (players.length === 2) {
    return c.json({
      redirectPath: "/game-page",
      players,
      myId,
      roomID,
      status: 302,
    });
  }

  return c.json({ players, myId, roomID, status: 200 });
};

const setCookies = (c, maxAge, sessionID, roomID) => {
  setCookie(c, "sessionID", sessionID, {
    maxAge,
  });
  setCookie(c, "roomID", roomID, {
    maxAge,
  });
};

export const loginHandler = async (c) => {
  const maxAge = 60 * 60 * 2;
  const session = c.get("session");
  const playerIdGenerator = c.get("playerIdGenerator");
  const idGenerator = c.get("idGenerator");
  const payload = await c.req.formData();
  const username = payload.get("username");
  const roomID = 101;
  const rooms = c.get("rooms");
  const players = rooms[roomID];

  if (username === null || username.trim() === "") {
    return c.json({ message: "invalid username" }, 401);
  }
  const sessionID = idGenerator();
  session[sessionID] = username;
  setCookies(c, maxAge, sessionID, roomID);

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

const getPlayerId = (c) => {
  const sessionID = getCookie(c, "sessionID");
  return (sessionID === undefined) ? -1 : Number(sessionID) - 1; // mocks the playerId
};

export const servePlayersData = (c) => {
  const playerId = getPlayerId(c);

  if (playerId === -1) {
    return c.text("BAD REQUEST", 400);
  }
  const game = c.get("games")["0"];
  const opponents = game.getOpponents(playerId);
  const player = game.getPlayer(playerId);

  return c.json({ opponents, player, playerId });
};
