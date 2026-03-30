import { attackCards, organCards } from "./constants.js";
import { Game } from "./models/game.js";
import { Player } from "./models/player.js";

export const gameSetup = async (ctx) => {
  const games = ctx.get("games");
  const shuffle = ctx.get("shuffle");
  const gameInfo = await ctx.req.json();
  const players = gameInfo.players.map(({ name, id }) => new Player(name, id));

  const game = new Game(players, attackCards, organCards, shuffle);
  game.distributeCards();
  games[gameInfo.roomId] = game;

  return ctx.json(game.getPlayers());
};
