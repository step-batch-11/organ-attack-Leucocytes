import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { serveOpponentHand } from "./handlers/serve_opponents_hands.js";
import { gameSetup } from "./game_setup.js";
import {
  resolveAction as resolveActionV2,
} from "./handlers/action_resolver.js";
import {
  handleOpponentAudit,
  resolveAction,
} from "./handlers/attack_handler.js";
import {
  getPlayerData,
  handleGetPlayers,
  serveAttackCardPile,
  serveGameState,
} from "./handlers/serve_players.js";
import {
  allowLoggedInUser,
  loginHandler,
  redirectLoggedInUser,
} from "./handlers/auth/auth.js";
import { createRoom, joinRoom } from "./handlers/room_handler.js";
import { serveUserDetails } from "./handlers/userHandler.js";

const waitingList = new Set();
const playersInLobby = new Set();

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
  players,
  idGenerator,
  playerIDGenerator,
  games,
  rooms,
  shuffle,
  gameController,
}, logger) => {
  const app = new Hono();
  app.use(logger());

  app.use(async (c, next) => {
    c.set("session", session);
    c.set("idGenerator", idGenerator);
    c.set("games", games);
    c.set("players", players);
    c.set("shuffle", shuffle);
    c.set("playerIDGenerator", playerIDGenerator);
    c.set("rooms", rooms);
    await next();
  });

  app.get(
    "/start-game",
    (c) => new Promise((resolve) => playersInLobby.add({ resolve, c })),
  );
  app.post("/setup-game", (c) => {
    for (const { resolve, c } of playersInLobby) {
      resolve(c.json({ started: true }));
    }
    waitingList.clear();
    return gameSetup(c);
  });

  app.post("/login", loginHandler);
  app.post("/attack", resolveAction);
  app.post("/opponent-hands", serveOpponentHand);
  app.post("/audit", handleOpponentAudit);
  app.post("/action", (ctx) => resolveActionV2(ctx, gameController));

  app.get("/poll", (c) => {
    return new Promise((resolve) => waitingList.add({ resolve, c }));
  });

  app.get("/discard-pile", serveAttackCardPile);
  app.get("/game-state", serveGameState);
  app.get(
    "/game-page",
    serveStatic({ root: "public", path: "/pages/game.html" }),
  );

  app.get("/create-room", createRoom);
  app.post("/join-room", joinRoom);

  app.get("/get-players", handleGetPlayers);
  app.get("/", allowLoggedInUser);
  app.get("/pages/login.html", redirectLoggedInUser);
  app.get("*", serveStatic({ root: "./public" }));
  app.get("/user-details", serveUserDetails )
  return app;
};
