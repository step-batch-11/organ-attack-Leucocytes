import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { RealtimeHub } from "../src/realtime.ts";
import { resolveWsConnection, WS_REJECTED_CODE } from "../src/ws_connection.ts";

const makeFakeSocket = (readyState = 1) => {
  const sent: string[] = [];
  const closeArgs: unknown[] = [];
  let closeListener: (() => void) | undefined;
  let openListener: (() => void) | undefined;
  let messageListener: ((event: { data: string }) => void) | undefined;
  return {
    sent,
    closeArgs,
    triggerClose() {
      closeListener?.();
    },
    triggerOpen() {
      openListener?.();
    },
    triggerMessage(data: string) {
      messageListener?.({ data });
    },
    send(data: string) {
      if (this.readyState !== 1) {
        throw new Error("InvalidStateError: 'readyState' not OPEN");
      }
      sent.push(data);
    },
    close(...args: unknown[]) {
      closeArgs.push(args);
    },
    readyState,
    addEventListener(
      type: "close" | "open" | "message",
      listener: (event?: { data: string }) => void,
    ) {
      if (type === "close") closeListener = listener as () => void;
      if (type === "open") openListener = listener as () => void;
      if (type === "message") {
        messageListener = listener as (event: { data: string }) => void;
      }
    },
  };
};

const noopRequestHandlers = {
  action: () => ({ success: true }),
  "remove-card": () => ({ success: true }),
  "query-opponent-hand": () => ({ success: true }),
  "audit-discard": () => ({ success: true }),
};

const makeSnapshotSpy = () => {
  const calls: Array<[string, number]> = [];
  const sendGameStateSnapshot = (roomID: string, playerID: number) => {
    calls.push([roomID, playerID]);
  };
  return { calls, sendGameStateSnapshot };
};

describe("resolveWsConnection", () => {
  it("registers the resolved playerID for a valid room and session", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };
    const { sendGameStateSnapshot } = makeSnapshotSpy();

    const accepted = resolveWsConnection(
      "101",
      5,
      socket,
      hub,
      rooms,
      noopRequestHandlers,
      sendGameStateSnapshot,
    );

    assertEquals(accepted, true);
    assertEquals(hub.getClients("101"), [{ playerID: 5, socket }]);
    assertEquals(socket.closeArgs.length, 0);
  });

  it("rejects and closes with WS_REJECTED_CODE when roomID is missing", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = {};
    const { sendGameStateSnapshot } = makeSnapshotSpy();

    const accepted = resolveWsConnection(
      undefined,
      5,
      socket,
      hub,
      rooms,
      noopRequestHandlers,
      sendGameStateSnapshot,
    );

    assertEquals(accepted, false);
    assertEquals(socket.closeArgs[0][0], WS_REJECTED_CODE);
    assertEquals(hub.getClientCount("101"), 0);
  });

  it("rejects and closes with WS_REJECTED_CODE when the session can't be resolved (-1)", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = { 101: { players: [], started: true } };
    const { sendGameStateSnapshot } = makeSnapshotSpy();

    const accepted = resolveWsConnection(
      "101",
      -1,
      socket,
      hub,
      rooms,
      noopRequestHandlers,
      sendGameStateSnapshot,
    );

    assertEquals(accepted, false);
    assertEquals(socket.closeArgs[0][0], WS_REJECTED_CODE);
  });

  it("rejects and closes with WS_REJECTED_CODE when the room doesn't exist", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = {};
    const { sendGameStateSnapshot } = makeSnapshotSpy();

    const accepted = resolveWsConnection(
      "999",
      5,
      socket,
      hub,
      rooms,
      noopRequestHandlers,
      sendGameStateSnapshot,
    );

    assertEquals(accepted, false);
    assertEquals(socket.closeArgs[0][0], WS_REJECTED_CODE);
  });

  it("deregisters the client from the hub when the socket closes", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };
    const { sendGameStateSnapshot } = makeSnapshotSpy();

    resolveWsConnection("101", 5, socket, hub, rooms, noopRequestHandlers, sendGameStateSnapshot);
    assertEquals(hub.getClientCount("101"), 1);

    socket.triggerClose();
    assertEquals(hub.getClientCount("101"), 0);
  });

  it("sends an immediate lobby-state snapshot when the room hasn't started", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = {
      101: {
        players: [{ id: 5, name: "chiru", type: "host" }, { id: 6, name: "kumar" }],
        started: false,
      },
    };
    const { sendGameStateSnapshot } = makeSnapshotSpy();

    resolveWsConnection("101", 5, socket, hub, rooms, noopRequestHandlers, sendGameStateSnapshot);

    assertEquals(socket.sent.length, 1);
    const message = JSON.parse(socket.sent[0]);
    assertEquals(message.type, "lobby-state");
    assertEquals(message.payload, {
      roomID: "101",
      players: rooms[101].players,
      started: false,
      myID: 5,
      isHost: true,
    });
  });

  it("sends an initial game-state snapshot (not a lobby-state one) once the room has started", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };
    const { calls, sendGameStateSnapshot } = makeSnapshotSpy();

    resolveWsConnection("101", 5, socket, hub, rooms, noopRequestHandlers, sendGameStateSnapshot);

    assertEquals(socket.sent.length, 0);
    assertEquals(calls, [["101", 5]]);
  });

  it("defers the initial game-state snapshot until the socket actually opens", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket(0); // WebSocket.CONNECTING
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };
    const { calls, sendGameStateSnapshot } = makeSnapshotSpy();

    resolveWsConnection("101", 5, socket, hub, rooms, noopRequestHandlers, sendGameStateSnapshot);

    assertEquals(calls.length, 0);

    socket.readyState = 1; // WebSocket.OPEN
    socket.triggerOpen();

    assertEquals(calls, [["101", 5]]);
  });

  it("defers the lobby-state snapshot until the socket actually opens (CONNECTING right after upgrade)", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket(0); // WebSocket.CONNECTING
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: false } };
    const { sendGameStateSnapshot } = makeSnapshotSpy();

    resolveWsConnection("101", 5, socket, hub, rooms, noopRequestHandlers, sendGameStateSnapshot);

    assertEquals(socket.sent.length, 0);

    socket.readyState = 1; // WebSocket.OPEN
    socket.triggerOpen();

    assertEquals(socket.sent.length, 1);
    assertEquals(JSON.parse(socket.sent[0]).type, "lobby-state");
  });

  it("marks isHost false for a non-host player's lobby snapshot", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = {
      101: {
        players: [{ id: 5, name: "chiru", type: "host" }, { id: 6, name: "kumar", type: "non-host" }],
        started: false,
      },
    };
    const { sendGameStateSnapshot } = makeSnapshotSpy();

    resolveWsConnection("101", 6, socket, hub, rooms, noopRequestHandlers, sendGameStateSnapshot);

    const message = JSON.parse(socket.sent[0]);
    assertEquals(message.payload.isHost, false);
    assertEquals(message.payload.myID, 6);
  });

  describe("client request dispatch", () => {
    it("dispatches an incoming request to the matching handler and acks only the sender", async () => {
      const hub = new RealtimeHub();
      const socket = makeFakeSocket();
      const otherSocket = makeFakeSocket();
      const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };
      const { sendGameStateSnapshot } = makeSnapshotSpy();

      const calls: unknown[] = [];
      const requestHandlers = {
        ...noopRequestHandlers,
        "remove-card": (roomID: string, playerID: number, payload: unknown) => {
          calls.push([roomID, playerID, payload]);
          return { removed: true };
        },
      };

      resolveWsConnection("101", 5, socket, hub, rooms, requestHandlers, sendGameStateSnapshot);
      resolveWsConnection("101", 6, otherSocket, hub, rooms, requestHandlers, sendGameStateSnapshot);
      socket.sent.length = 0;
      otherSocket.sent.length = 0;

      socket.triggerMessage(
        JSON.stringify({
          requestId: "req-1",
          type: "remove-card",
          payload: { attackCardID: 11, playerID: 5 },
        }),
      );
      await Promise.resolve();
      await Promise.resolve();

      assertEquals(calls, [["101", 5, { attackCardID: 11, playerID: 5 }]]);
      assertEquals(otherSocket.sent.length, 0);
      assertEquals(socket.sent.length, 1);

      const ack = JSON.parse(socket.sent[0]);
      assertEquals(ack, { type: "request-ack", requestId: "req-1", data: { removed: true } });
    });

    it("replies with request-error carrying the same requestId when the handler throws", async () => {
      const hub = new RealtimeHub();
      const socket = makeFakeSocket();
      const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };
      const { sendGameStateSnapshot } = makeSnapshotSpy();

      const requestHandlers = {
        ...noopRequestHandlers,
        action: () => {
          throw new Error("not your turn");
        },
      };

      resolveWsConnection("101", 5, socket, hub, rooms, requestHandlers, sendGameStateSnapshot);
      socket.sent.length = 0;

      socket.triggerMessage(JSON.stringify({ requestId: "req-2", type: "action", payload: {} }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      assertEquals(socket.sent.length, 1);
      const error = JSON.parse(socket.sent[0]);
      assertEquals(error, { type: "request-error", requestId: "req-2", message: "not your turn" });
    });

    it("replies with request-error for an unknown request type", () => {
      const hub = new RealtimeHub();
      const socket = makeFakeSocket();
      const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };
      const { sendGameStateSnapshot } = makeSnapshotSpy();

      resolveWsConnection("101", 5, socket, hub, rooms, noopRequestHandlers, sendGameStateSnapshot);
      socket.sent.length = 0;

      socket.triggerMessage(JSON.stringify({ requestId: "req-3", type: "not-a-thing", payload: {} }));

      assertEquals(socket.sent.length, 1);
      const error = JSON.parse(socket.sent[0]);
      assertEquals(error.type, "request-error");
      assertEquals(error.requestId, "req-3");
    });
  });
});
