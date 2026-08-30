/**
 * Entity and payload type definitions for players, events and actions.
 */

import type { AttackCard, OrganCardData } from "./cards.ts";

/**
 * Full detail projection of a {@link Player}, as returned by
 * `Player.getPlayerDetails()`.
 */
export interface PlayerDetails {
  /** Player display name. */
  name: string;
  /** Unique player id. */
  id: number;
  /** The player's current attack cards. */
  attackCards: AttackCard[];
  /** Public projections of the player's organs. */
  organCards: OrganCardData[];
  /** Remaining vaccine points (blocks incoming afflictions while > 0). */
  vaccinePoints: number;
  /** Whether the player is currently sleeping. */
  isSleeping: boolean;
  /** Whether the player still has at least one organ. */
  isAlive: boolean;
}

/**
 * A player's summary as exposed in the public game state. Extends
 * {@link PlayerDetails} without the private attack hand and adds turn context.
 */
export interface PublicPlayer {
  name: string;
  id: number;
  isAlive: boolean;
  organCards: OrganCardData[];
  isMyTurn: boolean;
  vaccinePoints: number;
  isSleeping: boolean;
  anyBodyHasPoison: boolean;
}

/**
 * Lightweight room-membership record kept in the `rooms` container.
 */
export interface RoomPlayer {
  id: number;
  name: string;
  type?: string;
}

/**
 * A room entry: its members and whether the game has started.
 */
export interface Room {
  players: RoomPlayer[];
  started?: boolean;
}

/**
 * Event describing the currently-resolving card, surfaced to clients.
 */
export interface GameEvent {
  /**
   * Stable identity for this specific card-play instance, assigned once by
   * `Game.registerEvent()` and left untouched by `updateEventStatus()` for
   * the rest of the response window. Lets clients tell "the same event,
   * re-broadcast for an unrelated reason" apart from "a genuinely new card
   * was played" without re-deriving identity from name/actor/card, which
   * exist before the id was introduced but aren't guaranteed unique.
   */
  id?: number;
  /** Event/card action name, or "idle" when nothing is resolving. */
  name: string;
  /** Player who initiated the event. */
  actor?: { name: string; id: number };
  /** Target of the event, if any. */
  target?: {
    player?: { name: string; id: number };
    organ?: { name: string; id: number };
  };
  /** The card that triggered the event. */
  card?: AttackCard;
  /** Whether the event's timer has elapsed. */
  resolved?: boolean;
  /** Milliseconds remaining on the event timer. */
  timeRemaining?: number;
}

/**
 * Action object constructed from an incoming request and pushed onto the
 * {@link ActionStack}. Fields are optional because different cards populate
 * different subsets.
 */
export interface ActionInput {
  /** Upper-snake-case action name (e.g. "AFFLICTION", "IMMUNITY_BOOST"). */
  name: string;
  /** The card being played. */
  card: AttackCard;
  attackerID?: number;
  opponentID?: number;
  organCardID?: number;
  organCardIDs?: number[];
  attackCardID?: number;
  selectedCardID?: number;
  isInstant?: boolean;
  canRemove?: boolean;
}
