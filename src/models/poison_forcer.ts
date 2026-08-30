import type { Game } from "./game.ts";

/**
 * Forces a stalled Poison holder's turn after a grace period, so an AFK or
 * uncooperative player can't freeze the whole room forever — holding an
 * unplayed Poison card disables every player's attack cards
 * (`Game#getAllPlayersDetails`'s `anyBodyHasPoison`) with no other way to
 * clear it. `check()` is meant to be called on every broadcast-worthy state
 * change; it only (re)starts the timeout when the holder actually changes,
 * so repeated calls while the same player is still stalling don't reset the
 * clock.
 */
export default class PoisonForcer {
  #game: Game;
  #onForceResolve: () => void;
  #durationMs: number;
  #timeoutID?: ReturnType<typeof setTimeout>;
  #currentHolderID: number | null;

  constructor(game: Game, onForceResolve: () => void, durationMs: number) {
    this.#game = game;
    this.#onForceResolve = onForceResolve;
    this.#durationMs = durationMs;
    this.#currentHolderID = null;
  }

  check(): void {
    const holderID = this.#game.getPoisonHolderID();

    if (holderID === this.#currentHolderID) return;

    this.#clear();
    this.#currentHolderID = holderID;

    if (holderID !== null) {
      this.#timeoutID = setTimeout(
        () => this.#forceResolve(holderID),
        this.#durationMs,
      );
    }
  }

  #forceResolve(holderID: number): void {
    this.#game.forceResolvePoison(holderID);
    this.#currentHolderID = null;
    this.#onForceResolve();
  }

  #clear(): void {
    clearTimeout(this.#timeoutID);
    this.#timeoutID = undefined;
  }
}
