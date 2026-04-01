import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { getPlayers, servePlayersData } from "./handlers/serve_players.js";
import {
  allowLoggedInUser,
  loginHandler,
  redirectLoggedInUser,
} from "./handlers/login_handler.js";
import { gameSetup } from "./game_setup.js";
import { handleAttack } from "./handlers/attack_handler.js";

const clients = [];

export const createApp = ({
  session,
  idGenerator,
  playerIdGenerator,
  games,
  rooms,
  shuffle,
}, logger) => {
  const app = new Hono();
  app.use(logger());

  app.use(async (c, next) => {
    c.set("session", session);
    c.set("idGenerator", idGenerator);
    c.set("games", games);
    c.set("shuffle", shuffle);
    c.set("playerIdGenerator", playerIdGenerator);
    c.set("rooms", rooms);
    await next();
  });

  app.post("/setup-game", gameSetup);
  app.post("/login", loginHandler);
  app.post("/attack", (c) => {
    clients.forEach((resolve) => resolve(c.json({ success: true })));
    return handleAttack(c);
  });

  app.get("/wait-for-affliction", () => {
    return new Promise((reslove) => {
      clients.push(reslove);
    });
  });

  app.get("/players-data", servePlayersData);
  app.get(
    "/game-page",
    serveStatic({ root: "public", path: "pages/game.html" }),
  );
  app.get("/get-players", getPlayers);
  app.get("/", allowLoggedInUser);
  app.get("/pages/login.html", redirectLoggedInUser);
  app.get("*", serveStatic({ root: "./public" }));

  return app;
};
