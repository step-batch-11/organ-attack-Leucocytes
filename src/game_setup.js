import { attackCards, organCards } from "./constants.js";
import { Game } from "./models/game.js";
import { Player } from "./models/player.js";

export const gameSetup = async (ctx) => {
  const games = ctx.get("games");
  const shuffle = ctx.get("shuffle");
  const rooms = ctx.get("rooms");
  const { roomID } = await ctx.req.json();

  if (!(roomID in rooms)) return ctx.json({ message: "Invalid roomId" }, 400);

  const players = rooms[roomID].map(({ name, id }) => new Player(name, id));

  const game = new Game(players, attackCards, organCards, shuffle);
  game.distributeCards();
  games[roomID] = game;

  return ctx.json(game.getPlayers(), 201);
};
