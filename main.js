import { createApp } from "./src/app.js";
import { counter } from "./src/utils.js";
import { logger } from "hono/logger";

const main = () => {
  const session = {};
  const idGenerator = counter();
  const games = {};

  const app = createApp({ session, idGenerator, games }, logger);
  const port = Deno.env.get("PORT") || 8000;

  Deno.serve({ port }, app.fetch);
};
main();
