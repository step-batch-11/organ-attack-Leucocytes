import { getCookie } from "hono/cookie";
import { getPlayerID } from "../utils.js";

export const handleGetPlayers = (c) => {
  const roomID = getCookie(c, "roomID");
  const sessionID = getCookie(c, "sessionID");
  const rooms = c.get("rooms");
  const session = c.get("session");
  const players = rooms[roomID];
  const player = players.find((player) => player.id === session[sessionID]);

  if ((player === undefined)) return c.json({ redirectPath: "/" }, 302);

  const myID = player.id;

  return c.json({ players, myID, roomID, redirectPath: "/game-page" }, 302);
};

export const getPlayerData = (c) => {
  const playerID = getPlayerID(c);

  if (playerID === -1) return { success: false, message: "BAD REQUEST" };

  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];
  const player = game.getPlayer(playerID);

  return { success: true, data: player };
};

export const serveGameState = (c) => {
  const roomID = getCookie(c, "roomID");
  const games = c.get("games");

  if (!(roomID in games)) {
    return c.json({ status: false, message: "Game not found" }, 401);
  }

  const game = games[roomID];
  const publicGameState = game.getGameState();

  const res = getPlayerData(c);
  const { data: playerData } = res;

  return c.json({ ...publicGameState, self: playerData, status: true });
};

export const serveAttackCardPile = (c) => {
  const roomID = getCookie(c, "roomID");
  const games = c.get("games");
  const game = games[roomID];

  return c.json(game.getDiscardAttackCards());
};

export const handleResearch = async (c) => {
  const { playerID, selectedCardID, researchID } = await c.req.json();
  const roomID = getCookie(c, "roomID");
  const games = c.get("games");
  const game = games[roomID];

  game.research(playerID, selectedCardID, researchID);
  game.passTurn();

  const gameState = game.getGameState();
  updateGameState(gameState);

  return c.json({ success: true }, 200);
};
