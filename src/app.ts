import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { serveStatic } from "hono/deno";
import { gameSetup } from "./game_setup.ts";
import {
  allowLoggedInUser,
  loginHandler,
  logoutHandler,
  redirectLoggedInUser,
} from "./handlers/auth/auth.ts";
import { serveUserDetails } from "./handlers/userHandler.ts";
import { createRoom, joinRoom, leaveLobby } from "./handlers/room_handler.ts";
import { getCookie } from "hono/cookie";
import { getPlayerID } from "./utils.ts";
import { resolveWsConnection } from "./ws_connection.ts";
import { createRequestHandlers } from "./ws_request_handlers.ts";
import type { RealtimeHub } from "./realtime.ts";
import type { Room } from "./types/entities.ts";
import type { AppBindings, RoomGame, Shuffle } from "./types/context.ts";

/**
 * Builds one player's personalized game-state payload: the shared public
 * snapshot plus their own hand (`self`) and the shared discard pile.
 * `discardPile` is folded in here rather than served via its own endpoint —
 * same reasoning as `self` for private data.
 */
const buildGameStateSnapshot =
  (games: Record<string, RoomGame>) => (roomID: string, playerID: number) => {
    const { game } = games[roomID];
    const publicGameState = game.getGameState();
    const discardPile = game.getDiscardAttackCards();
    const self = game.getPlayer(playerID);
    return { ...publicGameState, discardPile, self };
  };

/**
 * Builds a per-room-broadcast function that personalizes the game-state
 * payload for each connected socket (each player only sees their own hand).
 */
export const createUpdateGameState =
  (realtimeHub: RealtimeHub, games: Record<string, RoomGame>) =>
  (roomID: string): void => {
    const buildSnapshot = buildGameStateSnapshot(games);
    const seen = new Set<number>();

    for (const { playerID } of realtimeHub.getClients(roomID)) {
      if (seen.has(playerID)) continue;
      seen.add(playerID);

      realtimeHub.sendToPlayer(roomID, playerID, {
        type: "game-state",
        payload: buildSnapshot(roomID, playerID),
      });
    }
  };

/**
 * Sends one freshly-connected socket its initial personalized game-state —
 * the WS equivalent of the retired `/game-state` GET, used by
 * `resolveWsConnection` when a client connects to an already-started room.
 */
export const createSendGameStateSnapshot = (
  realtimeHub: RealtimeHub,
  games: Record<string, RoomGame>,
) => {
  const buildSnapshot = buildGameStateSnapshot(games);
  return (roomID: string, playerID: number): void => {
    realtimeHub.sendToPlayer(roomID, playerID, {
      type: "game-state",
      payload: buildSnapshot(roomID, playerID),
    });
  };
};

export const createApp = (
  {
    session,
    players,
    idGenerator,
    playerIDGenerator,
    games,
    rooms,
    shuffle,
    realtimeHub,
  }: {
    session: Record<string, number>;
    players: Record<number, string>;
    idGenerator: () => string;
    playerIDGenerator: () => number;
    games: Record<string, RoomGame>;
    rooms: Record<string, Room>;
    shuffle: Shuffle;
    realtimeHub: RealtimeHub;
  },
  logger: () => MiddlewareHandler<AppBindings>,
) => {
  const app = new Hono<AppBindings>();
  app.use(logger());
  app.use((c, next) => {
    console.log(c.req.url);

    console.log("websocket");

    return next();
  });
  const updateGameState = createUpdateGameState(realtimeHub, games);
  const sendGameStateSnapshot = createSendGameStateSnapshot(realtimeHub, games);
  const requestHandlers = createRequestHandlers(games, updateGameState);

  app.use(async (c, next) => {
    c.set("session", session);
    c.set("idGenerator", idGenerator);
    c.set("games", games);
    c.set("players", players);
    c.set("shuffle", shuffle);
    c.set("playerIDGenerator", playerIDGenerator);
    c.set("rooms", rooms);
    c.set("realtimeHub", realtimeHub);
    c.set("updateGameState", updateGameState);
    await next();
  });

  app.post("/setup-game", async (ctx) => {
    const roomID = getCookie(ctx, "roomID");
    if (roomID) {
      const rooms = ctx.get("rooms");
      rooms[roomID].started = true;
    }
    const result = await gameSetup(ctx);
    if (roomID) {
      realtimeHub.broadcast(roomID, {
        type: "game-started",
        payload: { redirectPath: "/game-page" },
      });
    }
    return result;
  });
  app.get("/logout", logoutHandler);
  app.post("/login", loginHandler);

  app.get("/ws", (c) => {
    const roomID = getCookie(c, "roomID");
    const playerID = getPlayerID(c);
    const { socket, response } = Deno.upgradeWebSocket(c.req.raw);

    resolveWsConnection(
      roomID,
      playerID,
      socket,
      realtimeHub,
      c.get("rooms"),
      requestHandlers,
      sendGameStateSnapshot,
    );

    return response;
  });

  app.get(
    "/game-page",
    serveStatic({ root: "public", path: "/pages/game.html" }),
  );

  app.get("/create-room", createRoom);
  app.post("/join-room", joinRoom);
  app.post("/leave-lobby", leaveLobby);

  app.get("/", allowLoggedInUser);
  app.get("/pages/login.html", redirectLoggedInUser);
  app.get("*", serveStatic({ root: "./public" }));
  app.get("/user-details", serveUserDetails);
  return app;
};
