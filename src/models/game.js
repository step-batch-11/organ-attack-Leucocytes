export class Game {
  #players;
  #attackCards;
  #discardPile;
  #organCards;

  constructor(players, attackCards, organCards) {
    this.#players = players;
    this.#attackCards = attackCards;
    this.#organCards = organCards;
    this.#discardPile = [];
  }

  #shuffleCards(cardSuffler) {
    this.#attackCards = cardSuffler(this.#attackCards);
    this.#organCards = cardSuffler(this.#organCards);
  }

  distributeCards(cardSuffler) {
    this.#shuffleCards(cardSuffler);

    const organCardsLimit = Math.floor(
      this.#organCards.length / this.#players.length,
    );
    const attackCardsLimit = 5;

    this.#players.forEach((player) => {
      const playerAttackCards = this.#attackCards.splice(0, attackCardsLimit);
      const playerOrganCards = this.#organCards.splice(0, organCardsLimit);
      player.fillHand(playerAttackCards, playerOrganCards);
    });
  }

  getPlayers() {
    return this.#players.map((player) => player.getPlayerDetails());
  }
}
