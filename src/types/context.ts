/**
 * Hono context typing and the dependency-injection container shape.
 *
 * `AppBindings` describes the variables stored via `c.set()` in the root
 * middleware and later retrieved via `c.get()` across handlers. Typing the
 * Hono app with these bindings makes context access type-safe.
 */

import type { Game } from "../models/game.ts";
import type { Room } from "./entities.ts";
import type { RealtimeHub } from "../realtime.ts";
import type GameController from "../controllers/game_controller.ts";

/**
 * Shuffles an array, returning a new (or reordered) array of the same type.
 */
export type Shuffle = <T>(items: T[]) => T[];

/**
 * A room's active {@link Game} plus the resolution collaborators
 * (`ActionStack`/`ActionController`/`Timer` via `GameController`)
 * constructed for that room alone — each room gets its own instance so two
 * concurrent games never share pending-action or response-timer state.
 */
export interface RoomGame {
  game: Game;
  gameController: GameController;
}

/**
 * Variables shared across all requests via Hono's context.
 */
export interface AppVariables {
  /** Maps a session id to a player id. */
  session: Record<string, number>;
  /** Maps a player id to a username. */
  players: Record<number, string>;
  /** Maps a room id to its active {@link RoomGame}. */
  games: Record<string, RoomGame>;
  /** Maps a room id to its {@link Room} membership record. */
  rooms: Record<string, Room>;
  /** Deterministic-injectable array shuffler. */
  shuffle: Shuffle;
  /** Generates unique session ids. */
  idGenerator: () => string;
  /** Generates sequential player ids. */
  playerIDGenerator: () => number;
  /** Shared real-time transport for a room's connected WebSocket clients. */
  realtimeHub: RealtimeHub;
  /** Broadcasts a room's current game state, personalized per connected player. */
  updateGameState: (roomID: string) => void;
}

/**
 * Hono generics binding used as `new Hono<AppBindings>()` so that
 * `c.get()`/`c.set()` are strongly typed.
 */
export interface AppBindings {
  Variables: AppVariables;
}

/**
 * The dependency-injection container assembled in `main.ts` and threaded
 * into `createApp`.
 */
export type AppDeps = AppVariables;
