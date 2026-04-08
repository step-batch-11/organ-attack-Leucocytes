import { Player } from "./player.js";

export class TurnManager {
  #players;
  #next;
  #playerCount;
  #turn;

  constructor(players = [new Player()], pioneerIndex) {
    this.#players = players;
    this.#next = 1;
    this.#playerCount = this.#players.length;
    this.#turn = pioneerIndex;
  }

  setTurn(pioneer = 0) {
    this.#turn = pioneer;
  }
  changeDirection() {
    this.#next = this.#next === 1 ? -1 : 1;
  }
  #getNextIndex() {
    return (this.#turn + this.#next + this.#playerCount) % this.#playerCount;
  }

  #getNextPlayer() {
    return this.#players[this.#getNextIndex()];
  }

  passTurn() {
    const currPlayer = this.#players[this.#turn];

    if (currPlayer.isSleeping()) {
      currPlayer.decreaseSleep();
    }

    let nextIndex = this.#getNextIndex();

    while (this.#players[nextIndex].isSleeping()) {
      this.#players[nextIndex].decreaseSleep();
      this.#turn = nextIndex;
      nextIndex = this.#getNextIndex();
    }

    this.#turn = nextIndex;
    return this.#turn;
  }
}
