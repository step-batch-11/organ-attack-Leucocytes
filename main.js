import { createApp } from "./src/app.js";
import { counter } from "./src/utils.js";
import { logger } from "hono/logger";
import { shuffle } from "@std/random";

const main = () => {
  const session = {};
  const idGenerator = counter();
  const games = {};
  const playerIDGenerator = counter();
  const rooms = { 101: [] };

  const app = createApp({
    session,
    idGenerator,
    playerIDGenerator,
    games,
    rooms,
    shuffle,
  }, logger);

  const port = Deno.env.get("PORT") || 8000;

  Deno.serve({ port }, app.fetch);
};
main();
