import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { RealtimeHub } from "../src/realtime.ts";
import { resolveWsConnection, WS_REJECTED_CODE } from "../src/ws_connection.ts";

const makeFakeSocket = (readyState = 1) => {
  const sent: string[] = [];
  const closeArgs: unknown[] = [];
  let closeListener: (() => void) | undefined;
  let openListener: (() => void) | undefined;
  return {
    sent,
    closeArgs,
    triggerClose() {
      closeListener?.();
    },
    triggerOpen() {
      openListener?.();
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
    addEventListener(type: "close" | "open", listener: () => void) {
      if (type === "close") closeListener = listener;
      if (type === "open") openListener = listener;
    },
  };
};

describe("resolveWsConnection", () => {
  it("registers the resolved playerID for a valid room and session", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };

    const accepted = resolveWsConnection("101", 5, socket, hub, rooms);

    assertEquals(accepted, true);
    assertEquals(hub.getClients("101"), [{ playerID: 5, socket }]);
    assertEquals(socket.closeArgs.length, 0);
  });

  it("rejects and closes with WS_REJECTED_CODE when roomID is missing", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = {};

    const accepted = resolveWsConnection(undefined, 5, socket, hub, rooms);

    assertEquals(accepted, false);
    assertEquals(socket.closeArgs[0][0], WS_REJECTED_CODE);
    assertEquals(hub.getClientCount("101"), 0);
  });

  it("rejects and closes with WS_REJECTED_CODE when the session can't be resolved (-1)", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = { 101: { players: [], started: true } };

    const accepted = resolveWsConnection("101", -1, socket, hub, rooms);

    assertEquals(accepted, false);
    assertEquals(socket.closeArgs[0][0], WS_REJECTED_CODE);
  });

  it("rejects and closes with WS_REJECTED_CODE when the room doesn't exist", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = {};

    const accepted = resolveWsConnection("999", 5, socket, hub, rooms);

    assertEquals(accepted, false);
    assertEquals(socket.closeArgs[0][0], WS_REJECTED_CODE);
  });

  it("deregisters the client from the hub when the socket closes", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };

    resolveWsConnection("101", 5, socket, hub, rooms);
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

    resolveWsConnection("101", 5, socket, hub, rooms);

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

  it("does not send a lobby-state snapshot once the room has started", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket();
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: true } };

    resolveWsConnection("101", 5, socket, hub, rooms);

    assertEquals(socket.sent.length, 0);
  });

  it("defers the lobby-state snapshot until the socket actually opens (CONNECTING right after upgrade)", () => {
    const hub = new RealtimeHub();
    const socket = makeFakeSocket(0); // WebSocket.CONNECTING
    const rooms = { 101: { players: [{ id: 5, name: "chiru" }], started: false } };

    resolveWsConnection("101", 5, socket, hub, rooms);

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

    resolveWsConnection("101", 6, socket, hub, rooms);

    const message = JSON.parse(socket.sent[0]);
    assertEquals(message.payload.isHost, false);
    assertEquals(message.payload.myID, 6);
  });
});
