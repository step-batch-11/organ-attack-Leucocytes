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

export const getPlayerData = (c) => {
  const playerId = getPlayerId(c);

  if (playerId === -1) {
    return { success: false, message: "BAD REQUEST" };
  }
  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];
  const player = game.getPlayer(playerId);

  return { success: true, data: player };
};

export const serveGameState = (c) => {
  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];

  const publicGameState = game.getGameState();

  const res = getPlayerData(c);
  const { data: playerData } = res;

  return c.json({ ...publicGameState, self: playerData });
};
