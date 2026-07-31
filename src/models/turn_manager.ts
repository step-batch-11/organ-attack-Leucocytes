import { Player } from "./player.ts";

export class TurnManager {
  #players: Player[];
  #next: number;
  #playerCount: number;
  #turn: number;

  // @ts-expect-error preserved broken state: Player now requires constructor
  // arguments, but the original default instantiated it with none.
  constructor(players: Player[] = [new Player()], pioneerIndex?: number) {
    this.#players = players;
    this.#next = 1;
    this.#playerCount = this.#players.length;
    this.#turn = pioneerIndex as number;
  }

  setTurn(pioneer = 0): void {
    this.#turn = pioneer;
  }

  changeDirection(): void {
    this.#next = this.#next === 1 ? -1 : 1;
  }

  #getNextIndex(): number {
    return (this.#turn + this.#next + this.#playerCount) % this.#playerCount;
  }

  /**
   * Advances the turn. `skipDecrementForCurrent` suppresses the outgoing
   * player's sleep decrement — used when the pass is triggered by an instant
   * (e.g. Narcolepsy) that just put the *current* player to sleep in this
   * same resolution cycle, so that freshly-granted sleep isn't immediately
   * canceled before it ever prevents their next turn.
   */
  passTurn(skipDecrementForCurrent = false): number {
    const currPlayer = this.#players[this.#turn];

    if (!skipDecrementForCurrent && currPlayer.isSleeping()) {
      currPlayer.decreaseSleep();
    }

    let nextIndex = this.#getNextIndex();

    while (
      this.#players[nextIndex].isSleeping() ||
      !this.#players[nextIndex].isAlive()
    ) {
      if (!(this.#players[nextIndex].isAlive())) {
        this.#players[nextIndex].discardAttackHand();
      } else {
        this.#players[nextIndex].decreaseSleep();
      }

      this.#turn = nextIndex;
      nextIndex = this.#getNextIndex();
    }

    this.#turn = nextIndex;
    return this.#turn;
  }
}
