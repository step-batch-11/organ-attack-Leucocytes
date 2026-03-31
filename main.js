import { createApp } from "./src/app.js";
import { mockGame } from "./src/mock_game_state.js";
import { counter } from "./src/utils.js";
import { logger } from "hono/logger";
import { shuffle } from "@std/random";

const main = () => {
  const session = {};
  const idGenerator = counter();
  const games = {};
  const playerIdGenerator = counter();
  const rooms = { 101: [] };

  games[0] = mockGame();

  const app = createApp({
    session,
    idGenerator,
    playerIdGenerator,
    games,
    rooms,
    shuffle,
  }, logger);

  const port = Deno.env.get("PORT") || 8000;

  Deno.serve({ port }, app.fetch);
};
main();
