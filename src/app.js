import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { getCookie } from "hono/cookie";
import {
  allowLoggedInUser,
  loginHandler,
  redirectLoggedInUser,
} from "./handlers.js";
import { shuffle } from "@std/random";
import { gameSetup } from "./game_setup.js";


export const createApp = ({
  session,
  idGenerator,
  games,
}, logger) => {
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

  app.get("/players-data", (c) => {
    const playerId = Number(getCookie(c, "sessionID")) - 1;

    const game = c.get("games")[0];
    const otherPlayersData = game.getPlayers().filter(({ id }) =>
      id !== playerId
    );
    const currentPlayerData = game.getPlayer(playerId);

    return c.json({ otherPlayersData, currentPlayerData, playerId });
  });

  app.post("/login", loginHandler);
  app.get("/", allowLoggedInUser);
  app.get("/pages/login.html", redirectLoggedInUser);
  app.get("*", serveStatic({ root: "./public" }));

  return app;
};
