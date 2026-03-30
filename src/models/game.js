export class Game {
  #players;
  constructor(players) {
    this.#players = players;
  }

  getPlayers() {
    return this.#players.map((player) => player.getPlayerDetails());
  }
}
