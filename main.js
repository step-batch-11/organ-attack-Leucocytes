import { createApp } from "./src/app.js";
import { Game } from "./src/models/game.js";
import { Player } from "./src/models/player.js";
import { counter } from "./src/utils.js";
import { logger } from "hono/logger";
import { shuffle } from "jsr:@std/random";

const main = () => {
  const session = {};
  const idGenerator = counter();
  const games = {};

  const players = Array.from({ length: 6 }, (_, i) => new Player(`p${i}`, i));
  const attackCards = JSON.parse(
    Deno.readTextFileSync("data/attack_cards.json"),
  );
  const organCards = JSON.parse(Deno.readTextFileSync("data/organ_cards.json"));
  const game = new Game(players, attackCards, organCards, shuffle);
  game.distributeCards();

  games[0] = game;

  const app = createApp({ session, idGenerator, games }, logger);

  const port = Deno.env.get("PORT") || 8000;

  Deno.serve({ port }, app.fetch);
};
main();
