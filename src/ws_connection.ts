import type { RealtimeHub } from "./realtime.ts";
import type { RealtimeSocket } from "./types/realtime.ts";
import type { Room } from "./types/entities.ts";

/**
 * Close code sent when a `/ws` upgrade is rejected because the connection's
 * `roomID`/session is invalid (as opposed to a transient network drop).
 * Lets clients distinguish "give up and redirect" from "retry".
 */
export const WS_REJECTED_CODE = 4001;

/**
 * Decides whether a `/ws` upgrade should be accepted, registers it with the
 * hub, wires disconnect cleanup, and (for a not-yet-started room) sends an
 * immediate lobby snapshot. Kept as a plain function — independent of Hono's
 * `Context` and `Deno.upgradeWebSocket` — so it can be unit-tested with fake
 * sockets without driving a real WebSocket handshake.
 *
 * Returns `true` if the connection was accepted, `false` if it was rejected
 * (and closed).
 */
export const resolveWsConnection = (
  roomID: string | undefined,
  playerID: number,
  socket: RealtimeSocket,
  realtimeHub: RealtimeHub,
  rooms: Record<string, Room>,
): boolean => {
  if (!roomID || playerID === -1 || !(roomID in rooms)) {
    socket.close(WS_REJECTED_CODE, "invalid room or session");
    return false;
  }

  realtimeHub.registerClient(roomID, { playerID, socket });
  socket.addEventListener("close", () => {
    realtimeHub.removeClient(roomID, socket);
  });

  const room = rooms[roomID];
  if (!room.started) {
    const sendLobbySnapshot = () => {
      realtimeHub.sendToPlayer(roomID, playerID, {
        type: "lobby-state",
        payload: {
          roomID,
          players: room.players,
          started: false,
          myID: playerID,
          isHost: room.players.some((p) => p.id === playerID && p.type === "host"),
        },
      });
    };

    // A freshly upgraded socket is still CONNECTING (readyState 0) at this
    // point — sending before the "open" event fires throws InvalidStateError.
    const OPEN = 1;
    if (socket.readyState === OPEN) {
      sendLobbySnapshot();
    } else {
      socket.addEventListener("open", sendLobbySnapshot);
    }
  }

  return true;
};
