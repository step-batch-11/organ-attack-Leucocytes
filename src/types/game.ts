/**
 * Game-state and result type definitions.
 */

import type { GameEvent, PublicPlayer } from "./entities.ts";
import type { OrganCardData } from "./cards.ts";

/**
 * Generic result envelope returned throughout the controller/model layers.
 */
export interface ActionResult<T = unknown> {
  /** Whether the operation succeeded. */
  success: boolean;
  /** Human-readable message, typically populated on failure. */
  message?: string;
  /** Optional payload carried on success. */
  data?: T;
}

/**
 * Full public game-state payload returned by `Game.getGameState()` and
 * broadcast to connected clients.
 */
export interface GameState {
  /** All players' public projections. */
  players: PublicPlayer[];
  /** Id of the player whose turn it currently is. */
  currentPlayer: number;
  /** The currently-resolving event (or an idle event). */
  event: GameEvent;
  /** Organs that have been discarded, as public projections. */
  organDiscardPile: OrganCardData[];
}
