import { Game } from "./models/game.js";
import { Player } from "./models/player.js";
import { shuffle } from "@std/random";

import * as attacks from "../data/attack_cards.json" with { type: "json" };
import * as organs from "../data/organ_cards.json" with { type: "json" };

export const mockGame = () => {
  const players = Array.from({ length: 6 }, (_, i) => new Player(`p${i}`, i));
  const attackCards = attacks.default;
  const organCards = organs.default;
  const game = new Game(players, attackCards, organCards, shuffle);
  game.distributeCards();

  return game;
};
