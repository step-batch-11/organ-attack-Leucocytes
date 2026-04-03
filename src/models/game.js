export class Game {
  #players;
  #attackCards;
  #organCards;
  #dealer;
  #afflictionHandler;
  #currentPlayer;

  constructor(players, attackCards, organCards, dealer, afflictionHandler) {
    this.#players = players;
    this.#attackCards = attackCards;
    this.#organCards = organCards;
    this.#dealer = dealer;
    this.#afflictionHandler = afflictionHandler;
  }

  setFirstPlayer() {
    this.#currentPlayer = this.#players
      .findIndex((player) => player.holdsWild());
    return this.#currentPlayer;
  }

  dealCards() {
    this.#dealer.dealCards();
  }

  discardAttackCard(attackerID, attackCardID, isInstant) {
    const attacker = this.#findPlayer(attackerID);
    if (!isInstant) {
      this.#currentPlayer = ++this.#currentPlayer % this.#players.length;
    }
    return this.#afflictionHandler.discardAttackCard(attacker, attackCardID);
  }

  afflictOrganOfOpponent(opponentID, organCardID) {
    const opponent = this.#findPlayer(opponentID);
    this.#afflictionHandler.afflictOrganOfOpponent(opponent, organCardID);
  }

  #discardAllAttackCards() {
    this.#players.forEach((player) => {
      const attackCards = player.discardAllAttackCards();
      attackCards.forEach((card) => this.#attackCards.addToDiscardPile(card));
    });
  }

  applyVaccine(playerID) {
    const player = this.#findPlayer(playerID);
    player.applyVaccine();
  }

  chartMixup() {
    this.#discardAllAttackCards();
    this.#attackCards.refillDrawingPile();
    this.#dealer.dealAttackCards();
  }

  #findPlayer(id) {
    return this.#players.find((player) => player.getId() === id);
  }

  getAllPlayersDetails() {
    return this.#players.map((player) => {
      const { name, id, organCards, vaccinePoints } = player.getPlayerDetails();
      return {
        name,
        id,
        organCards,
        isMyTurn: this.#isPlayerTurn(id),
        vaccinePoints,
      };
    });
  }

  getOpponents(id) {
    return this.getAllPlayersDetails().filter((player) => player.id !== id);
  }

  getPlayer(id) {
    const player = this.#findPlayer(id);
    return { ...player.getPlayerDetails(), isMyTurn: this.#isPlayerTurn(id) };
  }

  #isPlayerTurn(id) {
    const player = this.#players[this.#currentPlayer];
    if (player === undefined) return false;
    return player.getId() === id;
  }
}
