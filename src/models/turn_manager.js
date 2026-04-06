import { Player } from "./player.js";

export class TurnManager {
  #players;
  #next;
  #playerCount;
  #turn;

  constructor(players = [new Player()], pioneer) {
    this.#players = players;
    this.#next = 1;
    this.#playerCount = this.#players.length;
    this.#turn = pioneer;
  }

  setTurn(pioneer = 0) {
    this.#turn = pioneer;
  }

  passTurn() {
    while (this.#getNextPlayer().isSleeping()) {
      this.#getNextPlayer().decreaseSleep();
      this.#turn += this.#next;
      this.#turn = this.#turn % this.#playerCount;
    }

    this.#turn += this.#next;
    this.#turn = this.#turn % this.#playerCount;
    return this.#turn;
  }

  #getNextPlayer() {
    const count = (this.#turn + 1) % this.#playerCount;
    return this.#players[count];
  }
}
