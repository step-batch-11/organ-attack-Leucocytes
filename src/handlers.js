import { getCookie, setCookie } from "hono/cookie";


export const getPlayers = (c) => {
  const rooms = c.get("rooms");
  const roomID = getCookie(c, "roomID");
  const players = rooms[roomID];
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");
  const myId = players.find((player) => player.name === session[sessionID]).id;

  if (players.length === 6) {
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


const getPlayerId = (c) => {
  const sessionID = getCookie(c, "sessionID");
  if (sessionID === undefined) return -1;

  const session = c.get("session");
  const playerName = session[sessionID];
  const roomID = getCookie(c, "roomID");
  const rooms = c.get("rooms");
  return rooms[roomID].find(({ name }) => name === playerName).id;
};

export const servePlayersData = (c) => {
  const playerId = getPlayerId(c);

  if (playerId === -1) {
    return c.text("BAD REQUEST", 400);
  }
  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];

  const opponents = game.getOpponents(playerId);
  const player = game.getPlayer(playerId);

  return c.json({ opponents, player });
};
