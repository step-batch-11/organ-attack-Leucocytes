import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { serveOpponentHand } from "./handlers/serve_opponents_hands.ts";
import { gameSetup } from "./game_setup.ts";
import {
  resolveAction as resolveActionV2,
} from "./handlers/action_resolver.ts";
import {
  handleOpponentAudit,
  resolveAction,
} from "./handlers/attack_handler.ts";
import {
  handleGetPlayers,
  serveAttackCardPile,
  serveGameState,
} from "./handlers/serve_players.ts";
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
import type { RealtimeHub } from "./realtime.ts";
import type { Game } from "./models/game.ts";
import type { Room } from "./types/entities.ts";
import type { Shuffle } from "./types/context.ts";

/**
 * Builds a per-room-broadcast function that personalizes the game-state
 * payload for each connected socket (each player only sees their own hand).
 */
export const createUpdateGameState = (
  realtimeHub: RealtimeHub,
  games: Record<string, Game>,
) =>
  (roomID: string): void => {
    const game = games[roomID];
    const publicGameState = game.getGameState();
    const seen = new Set<number>();

    for (const { playerID } of realtimeHub.getClients(roomID)) {
      if (seen.has(playerID)) continue;
      seen.add(playerID);

      const self = game.getPlayer(playerID);
      realtimeHub.sendToPlayer(roomID, playerID, {
        type: "game-state",
        payload: { ...publicGameState, self },
      });
    }
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
  realtimeHub,
}: {
  session: Record<string, number>;
  players: Record<number, string>;
  idGenerator: () => number;
  playerIDGenerator: () => number;
  games: Record<string, Game>;
  rooms: Record<string, Room>;
  shuffle: Shuffle;
  // deno-lint-ignore no-explicit-any
  gameController: any;
  realtimeHub: RealtimeHub;
  // deno-lint-ignore no-explicit-any
}, logger: () => any) => {
  const app = new Hono();
  app.use(logger());

  const updateGameState = createUpdateGameState(realtimeHub, games);

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
    const rooms = ctx.get("rooms");
    rooms[roomID].started = true;
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
  app.post("/attack", resolveAction);
  app.post("/opponent-hands", serveOpponentHand);
  app.post("/audit", handleOpponentAudit);
  app.post("/action", (ctx) => resolveActionV2(ctx, gameController));

  app.get("/ws", (c) => {
    const roomID = getCookie(c, "roomID");
    const playerID = getPlayerID(c);
    const { socket, response } = Deno.upgradeWebSocket(c.req.raw);

    resolveWsConnection(roomID, playerID, socket, realtimeHub, c.get("rooms"));

    return response;
  });

  app.post("/remove-card", async (c) => {
    const { attackCardID, playerID } = await c.req.json();

    const roomID = getCookie(c, "roomID");
    const game = c.get("games")[roomID];

    game.discardAttackCard(
      playerID,
      attackCardID,
    );

    return c.json({ success: true });
  });

  app.get("/discard-pile", serveAttackCardPile);
  app.get("/game-state", serveGameState);
  app.get(
    "/game-page",
    serveStatic({ root: "public", path: "/pages/game.html" }),
  );

  app.get("/create-room", createRoom);
  app.post("/join-room", joinRoom);
  app.post("/leave-lobby", leaveLobby);

  app.get("/get-players", handleGetPlayers);
  app.get("/", allowLoggedInUser);
  app.get("/pages/login.html", redirectLoggedInUser);
  app.get("*", serveStatic({ root: "./public" }));
  app.get("/user-details", serveUserDetails);
  return app;
};
