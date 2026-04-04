export class Game {
  #players;
  #attacksDeck;
  #organsDeck;
  #dealer;
  #afflictionHandler;
  #currentPlayer;
  #event;

  constructor(players, attackCards, organCards, dealer, afflictionHandler) {
    this.#players = players;
    this.#attacksDeck = attackCards;
    this.#organsDeck = organCards;
    this.#dealer = dealer;
    this.#afflictionHandler = afflictionHandler;
    this.#event = {};
  }

  #passTurn() {
    this.#currentPlayer = ++this.#currentPlayer % this.#players.length;
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
      this.#passTurn();
    }
    return this.#afflictionHandler.discardAttackCard(attacker, attackCardID);
  }

  afflictOrganOfOpponent(opponentID, organCardID, afflictPoints) {
    const opponent = this.#findPlayer(opponentID);
    this.#afflictionHandler.afflictOrganOfOpponent(
      opponent,
      organCardID,
      afflictPoints,
    );
  }

  #discardAllAttackCards() {
    this.#players.forEach((player) => {
      const attackCards = player.discardAllAttackCards();
      attackCards.forEach((card) => this.#attacksDeck.addToDiscardPile(card));
    });
  }

  chartMixup() {
    this.#discardAllAttackCards();
    this.#attacksDeck.refillDrawingPile();
    this.#dealer.dealAttackCards();
  }

  applyVaccine(playerID) {
    const player = this.#findPlayer(playerID);
    player.applyVaccine();
  }

  transplantOrgan(playerID, opponentID, organCardID) {
    const player = this.#findPlayer(playerID);
    const opponent = this.#findPlayer(opponentID);
    const organ = opponent.removeOrgan(organCardID);
    player.addOrgan(organ);
  }

  healOrgan(playerID, organCardID) {
    const player = this.#findPlayer(playerID);
    player.healOrgan(organCardID);
  }

  bythebook() {
    this.#players.forEach((player) => {
      const cards = player.getNonAfflictedCards();
      cards.forEach((card) => {
        this.#attacksDeck.addToDiscardPile(card);
        this.#afflictionHandler.refillAttackCard(player);
      });
    });
  }

  removeOrgan(playerID, organCardID) {
    const player = this.#findPlayer(playerID);
    const organ = player.removeOrgan(organCardID);
    this.#organsDeck.addToDiscardPile(organ);
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

  getGameState() {
    const players = this.getAllPlayersDetails();
    const currentPlayer = this.#players[this.#currentPlayer].getId();
    const event = this.#event;
    console.log("org deck =>>>>>", this.#organsDeck);

    const organDiscardPile = this.#organsDeck.getDiscardPile().map((organ) =>
      organ.getDetails()
    );
    console.log("orgs discard", organDiscardPile);

    return structuredClone({ players, currentPlayer, event, organDiscardPile });
  }

  registerEvent(event) {
    this.#event = event;
  }

  itsAlive(attackerID, organCardID) {
    const player = this.#findPlayer(attackerID);
    const organ = this.#organsDeck.getCardFromDiscardPile(organCardID);
    organ.reAnimate();
    player.addOrgan(organ);
    return organ;
  }
}
