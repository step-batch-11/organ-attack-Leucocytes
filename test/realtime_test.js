import { assertEquals } from "@std/assert";
import { RealtimeHub } from "../src/realtime.js";

Deno.test("RealtimeHub broadcasts messages to every client in the same room", () => {
  const hub = new RealtimeHub();
  const sentMessages = [];

  const socketA = {
    send: (message) => sentMessages.push(message),
    close: () => { },
  };
  const socketB = {
    send: (message) => sentMessages.push(message),
    close: () => { },
  };

  hub.registerClient("room-1", { playerID: 1, socket: socketA });
  hub.registerClient("room-1", { playerID: 2, socket: socketB });

  hub.broadcast("room-1", { type: "state", value: 1 });

  assertEquals(sentMessages.length, 2);
  assertEquals(JSON.parse(sentMessages[0]), { type: "state", value: 1 });
  assertEquals(JSON.parse(sentMessages[1]), { type: "state", value: 1 });
});

Deno.test("RealtimeHub removes disconnected clients", () => {
  const hub = new RealtimeHub();
  const socket = {
    send: () => { },
    close: () => { },
  };

  hub.registerClient("room-2", { playerID: 3, socket });
  hub.removeClient("room-2", socket);

  hub.broadcast("room-2", { type: "state", value: 2 });

  assertEquals(hub.getClientCount("room-2"), 0);
});
