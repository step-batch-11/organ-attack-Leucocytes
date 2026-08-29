import type { RealtimeHub } from "./realtime.ts";
import type {
  ClientRequest,
  RealtimeSocket,
  RequestHandlers,
} from "./types/realtime.ts";
import type { Room } from "./types/entities.ts";

/**
 * Close code sent when a `/ws` upgrade is rejected because the connection's
 * `roomID`/session is invalid (as opposed to a transient network drop).
 * Lets clients distinguish "give up and redirect" from "retry".
 */
export const WS_REJECTED_CODE = 4001;

/**
 * Parses one incoming `message` event as a {@link ClientRequest}, dispatches
 * it to the matching handler, and replies with `request-ack`/`request-error`
 * to the originating socket only — never broadcast. A malformed message or
 * an unknown `type` is treated as a request-level error, not a connection
 * failure (the socket stays open).
 */
const handleClientMessage = (
  roomID: string,
  playerID: number,
  event: { data: string },
  realtimeHub: RealtimeHub,
  requestHandlers: RequestHandlers,
): void => {
  let request: ClientRequest;
  try {
    request = JSON.parse(event.data);
  } catch {
    return;
  }

  // A frame that's valid JSON but not a well-formed request (e.g. the
  // literal text "null", a bare string, or an array) parses successfully —
  // guard the shape explicitly so a malformed-but-parseable frame is
  // ignored the same way invalid JSON is, instead of throwing uncaught
  // below (there's no requestId to correlate a request-error to anyway).
  if (
    request === null || typeof request !== "object" ||
    typeof (request as ClientRequest).requestId !== "string" ||
    typeof (request as ClientRequest).type !== "string"
  ) {
    return;
  }

  const { requestId, type, payload } = request;
  const handler = requestHandlers[type];

  if (handler === undefined) {
    realtimeHub.sendToPlayer(roomID, playerID, {
      type: "request-error",
      requestId,
      message: `Unknown request type: ${type}`,
    });
    return;
  }

  Promise.resolve()
    .then(() => handler(roomID, playerID, payload))
    .then((data) => {
      realtimeHub.sendToPlayer(roomID, playerID, {
        type: "request-ack",
        requestId,
        data,
      });
    })
    .catch((error) => {
      realtimeHub.sendToPlayer(roomID, playerID, {
        type: "request-error",
        requestId,
        message: error instanceof Error ? error.message : String(error),
      });
    });
};

/**
 * Decides whether a `/ws` upgrade should be accepted, registers it with the
 * hub, wires disconnect cleanup and request dispatch, and sends an immediate
 * personalized snapshot — `lobby-state` for a not-yet-started room,
 * `game-state` otherwise (this is the only source of the *initial* game
 * state now that `/game-state` is retired; every update after that still
 * comes from `updateGameState`'s broadcast). Kept as a plain function —
 * independent of Hono's `Context` and `Deno.upgradeWebSocket` — so it can be
 * unit-tested with fake sockets without driving a real WebSocket handshake.
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
  requestHandlers: RequestHandlers,
  sendGameStateSnapshot: (roomID: string, playerID: number) => void,
): boolean => {
  if (!roomID || playerID === -1 || !(roomID in rooms)) {
    socket.close(WS_REJECTED_CODE, "invalid room or session");
    return false;
  }

  realtimeHub.registerClient(roomID, { playerID, socket });
  socket.addEventListener("close", () => {
    realtimeHub.removeClient(roomID, socket);
  });
  socket.addEventListener("message", (event) => {
    handleClientMessage(roomID, playerID, event, realtimeHub, requestHandlers);
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
          isHost: room.players.some((p) =>
            p.id === playerID && p.type === "host"
          ),
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
  } else {
    const OPEN = 1;
    if (socket.readyState === OPEN) {
      sendGameStateSnapshot(roomID, playerID);
    } else {
      socket.addEventListener(
        "open",
        () => sendGameStateSnapshot(roomID, playerID),
      );
    }
  }

  return true;
};
