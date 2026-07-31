import { handleAction } from "./handlers/action_resolver.ts";
import type { RoomGame } from "./types/context.ts";
import type { RequestHandlers } from "./types/realtime.ts";

/**
 * Fields a client can supply for an `"action"` request, everything except
 * `attackerID` — the acting player is always the authenticated `playerID`
 * `resolveWsConnection` passes in, never a client-supplied id.
 */
type PlayCardPayload = {
  attackCardID: number;
  isInstant?: boolean;
  opponentID?: number;
  organCardID?: number;
  organCardIDs?: number[];
  selectedCardID?: number;
};

/**
 * Builds the map of WS request handlers dispatched by `resolveWsConnection`.
 * Each handler resolves the room's live `Game`/`GameController` from the
 * already-authenticated connection (no cookie/session re-read per message)
 * and returns whatever data should be echoed back in `request-ack.data`.
 * `playerID` is always the authenticated id for the socket — every handler
 * must derive the acting/requesting player from it, never from `payload`.
 */
export const createRequestHandlers = (
  games: Record<string, RoomGame>,
  updateGameState: (roomID: string) => void,
): RequestHandlers => ({
  action: (roomID, playerID, payload) => {
    const { game, gameController } = games[roomID];
    const rest = payload as PlayCardPayload;

    const card = game.getAttackCardData(playerID, rest.attackCardID);
    if (card === undefined) {
      throw new Error("You do not hold that card");
    }

    if (!card.isInstant && game.getCurrentPlayerID() !== playerID) {
      throw new Error("It is not your turn");
    }

    const body = { ...rest, attackerID: playerID };

    return handleAction(roomID, gameController, game, updateGameState, body);
  },

  "remove-card": (roomID, playerID, payload) => {
    const { attackCardID } = payload as { attackCardID: number };
    const { game } = games[roomID];

    if (game.getCurrentPlayerID() !== playerID) {
      throw new Error("It is not your turn");
    }

    if (!game.canDiscardAttackCard(playerID)) {
      throw new Error("Discard limit reached for this turn");
    }

    game.discardAttackCard(playerID, attackCardID);
    game.recordDiscard(playerID);
    updateGameState(roomID);
    return { success: true };
  },

  "query-opponent-hand": (roomID, playerID, payload) => {
    const { opponentID } = payload as { opponentID: number };
    const { game } = games[roomID];

    if (!game.hasActiveClinicalAudit(playerID)) {
      throw new Error("No active clinical-audit in progress");
    }

    const { attackCards, id, name } = game.getPlayer(opponentID);
    return { attackCards, id, name };
  },

  "audit-discard": (roomID, playerID, payload) => {
    const { opponentID, attackCardID } = payload as {
      opponentID: number;
      attackCardID: number;
    };
    const { game } = games[roomID];

    if (!game.hasActiveClinicalAudit(playerID)) {
      throw new Error("No active clinical-audit in progress");
    }

    game.audit(opponentID, attackCardID);
    updateGameState(roomID);
    return { success: true };
  },
});
