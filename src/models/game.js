import { TurnManager } from "./turn_manager.js";

export class Game {
  #players;
  #attackDeck;
  #organsDeck;
  #dealer;
  #afflictionHandler;
  #currentPlayer;
  #event;
  #turnManager;

  constructor(
    players,
    attackCards,
    organCards,
    dealer,
    afflictionHandler,
    turnManager = new TurnManager(),
  ) {
    this.#players = players;
    this.#attackDeck = attackCards;
    this.#organsDeck = organCards;
    this.#dealer = dealer;
    this.#afflictionHandler = afflictionHandler;
    this.#event = {};
    this.#turnManager = turnManager;
  }

  passTurn() {
    this.#currentPlayer = this.#turnManager.passTurn();
  }

  setFirstPlayer() {
    this.#currentPlayer = this.#players
      .findIndex((player) => player.holdsWild());
    this.#turnManager.setTurn(this.#currentPlayer);
    return this.#currentPlayer;
  }

  dealCards() {
    this.#dealer.dealCards();
  }

  discardAttackCard(attackerID, attackCardID) {
    const attacker = this.#findPlayer(attackerID);
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
      attackCards.forEach((card) => this.#attackDeck.addToDiscardPile(card));
    });
  }

  chartMixup() {
    this.#discardAllAttackCards();
    this.#attackDeck.refillDrawingPile();
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
        this.#attackDeck.addToDiscardPile(card);
        this.#afflictionHandler.refillAttackCard(player);
      });
    });
  }

  audit(playerID, attackCardID) {
    const player = this.#findPlayer(playerID);
    const discardedCard = player.removeAttackCard(attackCardID);
    this.#attackDeck.addToDiscardPile(discardedCard);
    this.#afflictionHandler.refillAttackCard(player);
  }

  research(playerID, selectedCardID, researchCardID) {
    const player = this.#findPlayer(playerID);
    player.removeAttackCard(researchCardID);
    const selectedCard = this.#attackDeck.getCardByID(selectedCardID);
    player.refillHand(selectedCard);
  }

  removeOrgan(playerID, organCardID) {
    const player = this.#findPlayer(playerID);
    const organ = player.removeOrgan(organCardID);
    this.#organsDeck.addToDiscardPile(organ);
  }

  #findPlayer(id) {
    return this.#players.find((player) => player.getID() === id);
  }

  getAllPlayersDetails() {
    return this.#players.map((player) => {
      const { name, id, organCards, vaccinePoints, isSleeping } = player
        .getPlayerDetails();
      return {
        name,
        id,
        organCards,
        isMyTurn: this.#isPlayerTurn(id),
        vaccinePoints,
        isSleeping,
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
    return player.getID() === id;
  }

  getGameState() {
    const currentPlayerID = this.#players[this.#currentPlayer].getID();
    const event = this.#event;
    const organDiscardPile = this.#organsDeck
      .getDiscardPile().map((organ) => organ.getDetails());

    const players = this.getAllPlayersDetails();
    return structuredClone({
      players,
      currentPlayer: currentPlayerID,
      event,
      organDiscardPile,
    });
  }

  registerEvent(event) {
    this.#event = event;
  }

  itsAlive(attackerID, organCardID) {
    const player = this.#findPlayer(attackerID);
    const organ = this.#organsDeck.getCardFromDiscardPile(organCardID);
    if (organ === -1) return -1;
    organ.reAnimate();
    player.addOrgan(organ);
    return organ;
  }

  applySedate(playerID) {
    const sleepPoints = 2;
    const playerToSedate = this.#players
      .find((player) => player.getID() === playerID);
    if (playerToSedate === undefined) {
      return -1;
    }
    return playerToSedate.applySleep(sleepPoints);
  }

  applyNarcolepsy(playerToSleepID) {
    const sleepPoints = 1;
    const playerToSleep = this.#players
      .find((player) => player.getID() === playerToSleepID);
    if (playerToSleep === undefined) {
      return -1;
    }
    // const currPlayerID = this.getCurrentPlayerID();
    // if (currPlayerID !== playerToSleepID) {
    playerToSleep.applySleep(sleepPoints);
    // }
  }
  applyCryopreservation(attackerID) {
    // const currPlayerID = this.getCurrentPlayerID();
    const sleepPoints = /*  (currPlayerID !== attackerID) ? 1 :  */ 2;

    for (const player of this.#players) {
      if (player.getID() !== attackerID) {
        player.applySleep(sleepPoints);
      }
    }
    return { success: true };
  }

  getCurrentPlayerID() {
    return this.#players[this.#currentPlayer].getID();
  }

  getDiscardAttackCards() {
    return [...this.#attackDeck.getDiscardPile()];
  }

  addToDiscardPile(card) {
    this.#attackDeck.addToDiscardPile(card);
  }

  exchangeCard(attackerID, attackCardID, opponentID) {
    const attacker = this.#findPlayer(attackerID);
    const opponent = this.#findPlayer(opponentID);

    const randomCardId = Math.floor(Math.random() * 5);

    const commonColdCard = attacker.removeAttackCard(attackCardID);
    const opponentCard = opponent.removeAttackCard(null, randomCardId);

    attacker.refillHand(opponentCard);
    opponent.refillHand(commonColdCard);
  }

  #swapOrgans(playerWithHeart, playerWithLungs) {
    const heart = playerWithHeart.removeOrgan(7); // Have to change magic numbers
    const lungs = playerWithLungs.removeOrgan(13);
    playerWithHeart.addOrgan(lungs);
    playerWithLungs.addOrgan(heart);
  }

  exchangeHeartAndLungs() {
    const playerWithHeart = this.#players.find((player) =>
      player.hasOrgan("heart")
    );
    const playerWithLungs = this.#players.find((player) =>
      player.hasOrgan("lungs")
    );
    if (playerWithHeart !== undefined && playerWithLungs !== undefined) {
      this.#swapOrgans(playerWithHeart, playerWithLungs);
    }
  }

  changeOrderOfPlay() {
    this.#players.reverse();
  }
}
