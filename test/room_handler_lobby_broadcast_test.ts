import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.ts";
import { RealtimeHub } from "../src/realtime.ts";
import { counter } from "../src/utils.ts";
import type { Room } from "../src/types/entities.ts";
import type { MiddlewareHandler } from "hono";
import type { AppBindings, RoomGame } from "../src/types/context.ts";

const logger = () => ((_c, next) => next()) as MiddlewareHandler<AppBindings>;

const makeFakeSocket = () => {
  const sent: string[] = [];
  return {
    sent,
    send(data: string) {
      sent.push(data);
    },
    close() {},
    readyState: 1,
    addEventListener() {},
  };
};

const buildApp = (
  rooms: Record<string, Room>,
  games: Record<string, RoomGame> = {},
) => {
  const realtimeHub = new RealtimeHub();
  const session = { "1": 1, "2": 2 };
  const players = { 1: "chiru", 2: "kumar" };
  const app = createApp({
    session,
    players,
    idGenerator: () => crypto.randomUUID(),
    playerIDGenerator: counter(),
    games,
    rooms,
    shuffle: (x) => x,
    realtimeHub,
  }, logger);

  return { app, realtimeHub };
};

describe("room_handler lobby broadcasts", () => {
  describe("joinRoom", () => {
    it("sends a lobby-state message to every room member after a player joins", async () => {
      const rooms = {
        101: {
          players: [{ id: 1, name: "chiru", type: "host" }],
          started: false,
        },
      };
      const { app, realtimeHub } = buildApp(rooms);

      const hostSocket = makeFakeSocket();
      realtimeHub.registerClient("101", { playerID: 1, socket: hostSocket });

      const formData = new FormData();
      formData.append("room-id", "101");
      const response = await app.request("/join-room", {
        method: "POST",
        headers: { cookie: "sessionID=2" },
        body: formData,
      });

      assertEquals(response.status, 302);
      assertEquals(hostSocket.sent.length, 1);

      const message = JSON.parse(hostSocket.sent[0]);
      assertEquals(message.type, "lobby-state");
      assertEquals(message.payload.players.map((p: { id: number }) => p.id), [
        1,
        2,
      ]);
      assertEquals(message.payload.myID, 1);
      assertEquals(message.payload.isHost, true);
    });

    it("does not broadcast when the room doesn't exist", async () => {
      const rooms = {};
      const { app, realtimeHub } = buildApp(rooms);
      const socket = makeFakeSocket();
      realtimeHub.registerClient("999", { playerID: 1, socket });

      const formData = new FormData();
      formData.append("room-id", "999");
      const response = await app.request("/join-room", {
        method: "POST",
        headers: { cookie: "sessionID=2" },
        body: formData,
      });

      assertEquals(response.status, 400);
      assertEquals(socket.sent.length, 0);
    });
  });

  describe("leaveLobby", () => {
    it("broadcasts an updated lobby-state to remaining members when a non-host leaves", async () => {
      const rooms = {
        101: {
          players: [
            { id: 1, name: "chiru", type: "host" },
            { id: 2, name: "kumar", type: "non-host" },
          ],
          started: false,
        },
      };
      const { app, realtimeHub } = buildApp(rooms);
      const hostSocket = makeFakeSocket();
      realtimeHub.registerClient("101", { playerID: 1, socket: hostSocket });

      const response = await app.request("/leave-lobby", {
        method: "POST",
        headers: { cookie: "sessionID=2; roomID=101" },
        body: JSON.stringify({ isHost: false }),
      });

      assertEquals(response.status, 200);
      assertEquals(hostSocket.sent.length, 1);

      const message = JSON.parse(hostSocket.sent[0]);
      assertEquals(message.type, "lobby-state");
      assertEquals(message.payload.players.map((p: { id: number }) => p.id), [
        1,
      ]);
    });

    it("does not remove the last player when leaveLobby is hit with a stale/unknown session id (regression: findIndex(-1) used to splice the last player)", async () => {
      const rooms = {
        101: {
          players: [
            { id: 1, name: "chiru", type: "host" },
            { id: 2, name: "kumar", type: "non-host" },
          ],
          started: false,
        },
      };
      const { app } = buildApp(rooms);

      // sessionID=999 has no entry in the session map, so getPlayerID
      // resolves to undefined — a stale/unknown session hitting leaveLobby.
      const response = await app.request("/leave-lobby", {
        method: "POST",
        headers: { cookie: "sessionID=999; roomID=101" },
        body: JSON.stringify({ isHost: false }),
      });

      assertEquals(response.status, 200);
      assertEquals(rooms[101].players.map((p) => p.id), [1, 2]);
    });

    it("broadcasts room-closed to remaining sockets when the host leaves", async () => {
      const rooms = {
        101: {
          players: [
            { id: 1, name: "chiru", type: "host" },
            { id: 2, name: "kumar", type: "non-host" },
          ],
          started: false,
        },
      };
      const { app, realtimeHub } = buildApp(rooms);
      const nonHostSocket = makeFakeSocket();
      realtimeHub.registerClient("101", { playerID: 2, socket: nonHostSocket });

      const response = await app.request("/leave-lobby", {
        method: "POST",
        headers: { cookie: "sessionID=1; roomID=101" },
        body: JSON.stringify({ isHost: true }),
      });

      assertEquals(response.status, 200);
      assertEquals(nonHostSocket.sent.length, 1);

      const message = JSON.parse(nonHostSocket.sent[0]);
      assertEquals(message.type, "room-closed");
      assertEquals("101" in rooms, false);
    });
  });

  describe("/setup-game", () => {
    it("broadcasts game-started to the room after setup completes", async () => {
      const rooms = {
        101: { players: [{ id: 1, name: "chiru" }], started: false },
      };
      const games = {};
      const { app, realtimeHub } = buildApp(rooms, games);
      const socket = makeFakeSocket();
      realtimeHub.registerClient("101", { playerID: 1, socket });

      const response = await app.request("/setup-game", {
        method: "POST",
        headers: { cookie: "roomID=101" },
        body: JSON.stringify({ roomID: "101" }),
      });

      assertEquals(response.status, 201);
      assertEquals(rooms[101].started, true);

      const gameStartedMessage = socket.sent
        .map((raw) => JSON.parse(raw))
        .find((message) => message.type === "game-started");
      assertEquals(gameStartedMessage.payload, { redirectPath: "/game-page" });
    });
  });
});
