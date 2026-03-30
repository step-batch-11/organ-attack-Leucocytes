import { Game } from "./models/game.js";

export const gameSetup = (players) => {
  const game = new Game(players);

  return game;
};
