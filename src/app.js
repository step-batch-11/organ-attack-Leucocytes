import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import {
  allowLoggedInUser,
  loginHandler,
  redirectLoggedInUser,
  servePlayersData,
} from "./handlers.js";
import { gameSetup } from "./game_setup.js";

export const createApp = ({ session, idGenerator, games, shuffle }, logger) => {
  const app = new Hono();
  app.use(logger());

  app.use(async (c, next) => {
    c.set("session", session);
    c.set("idGenerator", idGenerator);
    c.set("games", games);
    c.set("shuffle", shuffle);
    await next();
  });

  app.post("/setup-game", gameSetup);

  app.get("/players-data", servePlayersData);

  app.post("/login", loginHandler);
  app.get("/", allowLoggedInUser);
  app.get("/pages/login.html", redirectLoggedInUser);
  app.get("*", serveStatic({ root: "./public" }));

  return app;
};
