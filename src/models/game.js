export class Game {
  #players;
  #attackCards;
  #attacksDiscardPile;
  #organsDiscardPile;
  #organCards;
  #cardShuffler;
  #currentPlayer;

  constructor(players, attackCards, organCards, cardShuffler) {
    this.#players = players;
    this.#attackCards = attackCards;
    this.#organCards = organCards;
    this.#attacksDiscardPile = [];
    this.#organsDiscardPile = [];
    this.#cardShuffler = cardShuffler;
  }

  setFirstPlayer() {
    this.#currentPlayer = this.#players.findIndex((player) =>
      player.holdsWild()
    );
    return this.#currentPlayer;
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

  #findPlayer(id) {
    return this.#players.find((player) => player.getId() === id);
  }

  afflictOrganOfOpponent(opponentID, organCardID) {
    const opponent = this.#findPlayer(opponentID);
    const organ = opponent.afflictOrgan(organCardID);
    if (organ !== undefined) {
      this.#organsDiscardPile.push(organ);
    }
  }

  removeAttackFromAttacker(attackerID, attackCardID) {
    const attacker = this.#findPlayer(attackerID);
    const attackCard = attacker.removeAttackCard(attackCardID);
    this.#attacksDiscardPile.push(attackCard);
    const newAttackCard = this.#attackCards.pop();
    attacker.refillHand(newAttackCard);
    return attackCard;
  }

  getPlayers() {
    return this.#players.map((player) => {
      const { name, id, organCards, hasWild } = player.getPlayerDetails();
      return { name, id, organCards, hasWild };
    });
  }

  getOpponents(id) {
    return this.getPlayers().filter((player) => player.id !== id);
  }

  getPlayer(id) {
    const player = this.#findPlayer(id);
    return player.getPlayerDetails();
  }
}
