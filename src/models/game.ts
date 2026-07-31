import { TurnManager } from "./turn_manager.ts";
import type { Player } from "./player.ts";
import type { Organ } from "./organ.ts";
import type { Deck } from "./deck.ts";
import type { Dealer } from "./dealer.ts";
import type { AfflictionHandler } from "./affliction_handler.ts";
import type { AttackCard } from "../types/cards.ts";
import type {
  ActionInput,
  GameEvent,
  PlayerDetails,
  PublicPlayer,
} from "../types/entities.ts";
import type { GameState } from "../types/game.ts";

export class Game {
  #players: Player[];
  #attackDeck: Deck<AttackCard>;
  #organsDeck: Deck<Organ>;
  #dealer: Dealer;
  #afflictionHandler: AfflictionHandler;
  #currentPlayer!: number;
  #event: GameEvent;
  #turnManager: TurnManager;
  currentPlayedCard: boolean;

  constructor(
    players: Player[],
    attackCards: Deck<AttackCard>,
    organCards: Deck<Organ>,
    dealer: Dealer,
    afflictionHandler: AfflictionHandler,
    turnManager: TurnManager = new TurnManager(),
  ) {
    this.#players = players;
    this.#attackDeck = attackCards;
    this.#organsDeck = organCards;
    this.#dealer = dealer;
    this.#afflictionHandler = afflictionHandler;
    this.#event = {} as GameEvent;
    this.#turnManager = turnManager;
    this.currentPlayedCard = false;
  }

  passTurn(): void {
    if (this.currentPlayedCard) {
      this.#currentPlayer = this.#turnManager.passTurn();
      this.currentPlayedCard = false;
    }
  }

  setFirstPlayer(): number {
    const idx = this.#players
      .findIndex((player) => player.holdsWild());
    this.#currentPlayer = idx !== -1 ? idx : 0;
    this.#turnManager.setTurn(this.#currentPlayer);
    return this.#currentPlayer;
  }

  dealCards(): void {
    this.#dealer.dealCards();
  }

  currentTurnPlayed({ attackerID, card, opponentID }: ActionInput): void {
    const currentPlayer = this.#players[this.#currentPlayer];
    const playerID = currentPlayer.getID();
    const { action } = card;

    const isNarcolepsyPlayedOnMe = action === "narcolepsy" &&
      opponentID === playerID;

    const isCryoPlayedByMe = action === "cryopreservation" &&
      attackerID === playerID;

    this.currentPlayedCard = this.currentPlayedCard ||
      !isCryoPlayedByMe || isNarcolepsyPlayedOnMe ||
      attackerID === playerID && !card.isInstant;
  }

  discardAttackCard(attackerID: number, attackCardID: number): AttackCard {
    const attacker = this.#findPlayer(attackerID);
    return this.#afflictionHandler.discardAttackCard(attacker, attackCardID);
  }

  getAttackCardData(playerID: number, attackCardID: number): AttackCard {
    const player = this.#findPlayer(playerID);
    return player.attackCardData(attackCardID);
  }

  afflictOrganOfOpponent(
    opponentID: number,
    organCardID: number,
    afflictPoints?: number,
  ): void {
    const opponent = this.#findPlayer(opponentID);
    this.#afflictionHandler.afflictOrganOfOpponent(
      opponent,
      organCardID,
      afflictPoints,
    );
  }

  #discardAllAttackCards(): void {
    this.#players.forEach((player) => {
      const attackCards = player.discardAllAttackCards();
      attackCards.forEach((card) => this.#attackDeck.addToDiscardPile(card));
    });
  }

  chartMixup(): void {
    this.#discardAllAttackCards();
    this.#attackDeck.refillDrawingPile();
    this.#dealer.dealAttackCards();
  }

  applyVaccine(playerID: number): void {
    const player = this.#findPlayer(playerID);
    player.applyVaccine();
  }

  transplantOrgan(
    playerID: number,
    opponentID: number,
    organCardID: number,
  ): void {
    const player = this.#findPlayer(playerID);
    const opponent = this.#findPlayer(opponentID);
    const organ = opponent.removeOrgan(organCardID);
    player.addOrgan(organ);
  }

  healOrgan(playerID: number, organCardID: number): void {
    const player = this.#findPlayer(playerID);
    player.healOrgan(organCardID);
  }

  bythebook(): void {
    this.#players.forEach((player) => {
      const cards = player.getNonAfflictedCards();
      cards.forEach((card) => {
        this.#attackDeck.addToDiscardPile(card);
        this.#afflictionHandler.refillAttackCard(player);
      });
    });
  }

  audit(playerID: number, attackCardID: number): void {
    const player = this.#findPlayer(playerID);
    const discardedCard = player.removeAttackCard(attackCardID);
    this.#attackDeck.addToDiscardPile(discardedCard);
    this.#afflictionHandler.refillAttackCard(player);
  }

  research(
    playerID: number,
    selectedCardID: number,
    researchCardID: number,
  ): void {
    const player = this.#findPlayer(playerID);
    player.removeAttackCard(researchCardID);
    const selectedCard = this.#attackDeck.getCardByID(selectedCardID);
    player.refillHand(selectedCard as AttackCard);
  }

  removeOrgan(playerID: number, organCardID: number): void {
    const player = this.#findPlayer(playerID);
    const organ = player.removeOrgan(organCardID);
    this.#organsDeck.addToDiscardPile(organ);
  }

  // Cast preserves broken state: callers dereference the result without a
  // guard, so a missing id would already have thrown at runtime.
  #findPlayer(id: number): Player {
    return this.#players.find((player) => player.getID() === id) as Player;
  }

  getAllPlayersDetails(): PublicPlayer[] {
    const anyBodyHasPoison = this.#players.some((player) =>
      player.getPlayerDetails().attackCards.some(({ action }) =>
        action === "poison"
      )
    );
    return this.#players.map((player) => {
      const { name, id, organCards, vaccinePoints, isSleeping, isAlive } =
        player.getPlayerDetails();

      return {
        name,
        id,
        isAlive,
        organCards,
        isMyTurn: this.#isPlayerTurn(id),
        vaccinePoints,
        isSleeping,
        anyBodyHasPoison,
      };
    });
  }

  getOpponents(id: number): PublicPlayer[] {
    return this.getAllPlayersDetails().filter((player) => player.id !== id);
  }

  #setAllCardsStatus(cards: AttackCard[], status: boolean): void {
    cards.forEach((card) => card.isActive = status);
  }

  #setAttackStatus(cards: AttackCard[]): void {
    this.#setAllCardsStatus(cards, !this.#doesAnyoneHoldPoison());

    if (this.#event.card?.isBlockable && !this.#event.resolved) {
      cards.forEach((card) => {
        const action = card.action;
        card.isActive = action === "immunity-boost";
      });
    }
  }

  getPlayer(id: number): PlayerDetails & { isMyTurn: boolean } {
    const player = this.#findPlayer(id);
    const playerDetails = player.getPlayerDetails();

    this.#setAttackStatus(playerDetails.attackCards);

    return { ...playerDetails, isMyTurn: this.#isPlayerTurn(id) };
  }

  #isPlayerTurn(id: number): boolean {
    const player = this.#players[this.#currentPlayer];
    if (player === undefined) return false;

    return player.getID() === id;
  }

  #doesAnyoneHoldPoison(): boolean {
    const allAttackCardsInGame = this.#players
      .flatMap((player) => player.getPlayerDetails().attackCards);

    return allAttackCardsInGame.some(({ action }) => action === "poison");
  }

  updateEventStatus(timeRemaining: number): void {
    this.#event.resolved = timeRemaining <= 0;
    this.#event.timeRemaining = timeRemaining;
    if (this.#event.resolved) {
      this.#event.name = "idle";
    }
  }

  getGameState(): GameState {
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

  registerEvent(event: GameEvent): void {
    this.#event = event;
  }

  itsAlive(attackerID: number, organCardID: number): Organ | -1 {
    const player = this.#findPlayer(attackerID);
    const organ = this.#organsDeck.getCardFromDiscardPile(organCardID);

    if (organ === -1) return -1;

    organ.reAnimate();
    player.addOrgan(organ);
    return organ;
  }

  applySedate(playerID: number): number {
    const sleepPoints = 2;
    const playerToSedate = this.#players
      .find((player) => player.getID() === playerID);

    if (playerToSedate === undefined) return -1;

    return playerToSedate.applySleep(sleepPoints);
  }

  applyNarcolepsy(playerToSleepID: number): number | void {
    const sleepPoints = 1;
    const playerToSleep = this.#players
      .find((player) => player.getID() === playerToSleepID);
    if (playerToSleep === undefined) {
      return -1;
    }
    playerToSleep.applySleep(sleepPoints);
  }

  getOrganDiscardPile(): Organ[] {
    return this.#organsDeck.getDiscardPile();
  }

  applyCryopreservation(attackerID: number): { success: boolean } {
    const sleepPoints = 2;

    for (const player of this.#players) {
      if (player.getID() !== attackerID) player.applySleep(sleepPoints);
    }

    return { success: true };
  }

  getCurrentPlayerID(): number {
    return this.#players[this.#currentPlayer].getID();
  }

  getDiscardAttackCards(): AttackCard[] {
    return [...this.#attackDeck.getDiscardPile()];
  }

  addToDiscardPile(card: AttackCard): void {
    this.#attackDeck.addToDiscardPile(card);
  }

  removeFromDiscardPile(cardID: number): void {
    this.#attackDeck.removeFromDiscardPile(cardID);
  }

  exchangeCard(
    attackerID: number,
    attackCardID: number,
    opponentID: number,
  ): void {
    const attacker = this.#findPlayer(attackerID);
    const opponent = this.#findPlayer(opponentID);

    const randomCardId = Math.floor(Math.random() * 5);

    const commonColdCard = attacker.removeAttackCard(attackCardID);
    const opponentCard = opponent.removeAttackCard(null, randomCardId);

    attacker.refillHand(opponentCard);
    opponent.refillHand(commonColdCard);
  }

  #swapOrgans(playerWithHeart: Player, playerWithLungs: Player): void {
    const [HEART_ID, LUNG_ID] = [7, 13];
    const heart = playerWithHeart.removeOrgan(HEART_ID); // Have to change magic numbers
    const lungs = playerWithLungs.removeOrgan(LUNG_ID);

    playerWithHeart.addOrgan(lungs);
    playerWithLungs.addOrgan(heart);
  }

  exchangeHeartAndLungs(): void {
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

  changeOrderOfPlay(): void {
    this.#turnManager.changeDirection();
  }

  discardAttackHandOfPlayer(playerID: number): void {
    const player = this.#findPlayer(playerID);
    const cardsToDiscard = player.discardAttackHand();
    cardsToDiscard.forEach((card) => this.#attackDeck.addToDiscardPile(card));
  }
}
