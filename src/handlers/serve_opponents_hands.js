import { getCookie } from "hono/cookie";

export const serveOpponentHand = async (c) => {
  const { opponentID } = await c.req.json();
  const roomID = getCookie(c, "roomID");
  const games = c.get("games");
  const game = games[roomID];
  const { attackCards, id, name } = game.getPlayer(opponentID);
  return c.json({ attackCards, id, name });
};
