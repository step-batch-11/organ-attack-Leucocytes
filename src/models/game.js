export class Game {
  #players;
  #attackCards;
  #discardPile;
  #organCards;
  #cardShuffler;

  constructor(players, attackCards, organCards, cardShuffler) {
    this.#players = players;
    this.#attackCards = attackCards;
    this.#organCards = organCards;
    this.#discardPile = [];
    this.#cardShuffler = cardShuffler;
  }

  distributeCards() {
    this.#attackCards = this.#cardShuffler(this.#attackCards);
    this.#organCards = this.#cardShuffler(this.#organCards);

    const organCardsLimit = Math.floor(
      this.#organCards.length / this.#players.length,
    );

    const attackCardsLimit = 5;

    this.#players.forEach((player) => {
      const attackCards = this.#attackCards.splice(0, attackCardsLimit);
      const organCards = this.#organCards.splice(0, organCardsLimit);
      player.fillHand(attackCards, organCards);
    });
  }

  getPlayers() {
    return this.#players.map((player) => {
      const { name, id, organCards } = player.getPlayerDetails();
      return { name, id, organCards };
    });
  }
}
