import { createApp } from "./src/app.js";
import { counter } from "./src/utils.js";
import { logger } from "hono/logger";
import { shuffle } from "@std/random";
import GameController from "./src/controllers/game_controller.js";
import ActionController from "./src/controllers/action_controller.js";
import ActionStack from "./src/models/action_stack.js";
import Timer from "./src/models/timer.js";

const main = () => {
  const session = {};
  const players = {};
  const games = {};
  const rooms = { 101: [] };
  const timer = new Timer(5000);

  const idGenerator = () => Date.now() * Math.random();
  const playerIDGenerator = counter();

  const actionStack = new ActionStack();
  const actionController = new ActionController(actionStack);
  const gameController = new GameController(actionController, timer);

  const generators = { idGenerator, playerIDGenerator };
  const appUtils = { session, players, games, rooms, shuffle, gameController };

  const app = createApp({ ...generators, ...appUtils }, logger);
  const port = Deno.env.get("PORT") || 8000;
  Deno.serve({ port }, app.fetch);
};
main();
