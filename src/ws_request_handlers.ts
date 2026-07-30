import { handleAction } from "./handlers/action_resolver.ts";
import type { Game } from "./models/game.ts";
import type { RequestHandlers } from "./types/realtime.ts";

/**
 * Builds the map of WS request handlers dispatched by `resolveWsConnection`.
 * Each handler resolves the room's live `Game` from the already-authenticated
 * connection (no cookie/session re-read per message) and returns whatever
 * data should be echoed back in `request-ack.data`.
 */
export const createRequestHandlers = (
  games: Record<string, Game>,
  // deno-lint-ignore no-explicit-any
  gameController: any,
  updateGameState: (roomID: string) => void,
): RequestHandlers => ({
  action: (roomID, _playerID, payload) => {
    const game = games[roomID];
    return handleAction(roomID, gameController, game, updateGameState, payload);
  },

  "remove-card": (roomID, _playerID, payload) => {
    const { attackCardID, playerID } = payload as {
      attackCardID: number;
      playerID: number;
    };
    const game = games[roomID];
    game.discardAttackCard(playerID, attackCardID);
    updateGameState(roomID);
    return { success: true };
  },

  "query-opponent-hand": (roomID, _playerID, payload) => {
    const { opponentID } = payload as { opponentID: number };
    const game = games[roomID];
    const { attackCards, id, name } = game.getPlayer(opponentID);
    return { attackCards, id, name };
  },

  "audit-discard": (roomID, _playerID, payload) => {
    const { opponentID, attackCardID } = payload as {
      opponentID: number;
      attackCardID: number;
    };
    const game = games[roomID];
    game.audit(opponentID, attackCardID);
    updateGameState(roomID);
    return { success: true };
  },
});
