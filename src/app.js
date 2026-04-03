import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import {
  getPlayerData,
  getPlayers,
  serveGameState,
} from "./handlers/serve_players.js";
import {
  allowLoggedInUser,
  loginHandler,
  redirectLoggedInUser,
} from "./handlers/login_handler.js";
import { gameSetup } from "./game_setup.js";
import { resolveAction } from "./handlers/attack_handler.js";

const waitingList = new Set();

export const updateGameState = (publicGameState) => {
  for (const { resolve, c } of waitingList) {
    const res = getPlayerData(c);

    if (!res.success) {
      resolve(c.json({ message: res.message }, 400));
      return;
    }
    const { data: playerData } = res;
    const gameState = { ...publicGameState, self: playerData };
    resolve(c.json(gameState));
  }
  waitingList.clear();
  return;
};

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
  app.post("/attack", resolveAction);

  app.get("/poll", (c) => {
    return new Promise((resolve) => {
      waitingList.add({ resolve, c });
    });
  });

  app.get("/game-state", serveGameState);
  app.get(
    "/game-page",
    serveStatic({ root: "public", path: "/pages/game.html" }),
  );
  app.get("/get-players", getPlayers);
  app.get("/", allowLoggedInUser);
  app.get("/pages/login.html", redirectLoggedInUser);
  app.get("*", serveStatic({ root: "./public" }));

  return app;
};
