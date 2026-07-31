import { createApp } from "./src/app.ts";
import { counter } from "./src/utils.ts";
import { logger } from "hono/logger";
import { shuffle } from "@std/random";
import { RealtimeHub } from "./src/realtime.ts";

const main = () => {
  const session = {};
  const players = {};
  const games = {};
  const rooms = { 101: { players: [], started: false } };
  const realtimeHub = new RealtimeHub();

  const idGenerator = () => crypto.randomUUID();
  const playerIDGenerator = counter();

  const generators = { idGenerator, playerIDGenerator };
  const appUtils = {
    session,
    players,
    games,
    rooms,
    shuffle,
    realtimeHub,
  };

  const app = createApp({ ...generators, ...appUtils }, logger);
  const port = 8000;
  Deno.serve({ port }, app.fetch);
};

main();
