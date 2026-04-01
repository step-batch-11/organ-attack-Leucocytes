import { getCookie } from "hono/cookie";
import { getPlayerId } from "../utils.js";

export const getPlayers = (c) => {
  const rooms = c.get("rooms");
  const roomID = getCookie(c, "roomID");
  const players = rooms[roomID];
  const session = c.get("session");
  const sessionID = getCookie(c, "sessionID");
  const myId = players.find((player) => player.name === session[sessionID]).id;
  const props = { players, myId, roomID, status: 200 };

  if (players.length === 2) {
    props.status = 302;
    props.redirectPath = "/game-page";
  }

  return c.json(props);
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
