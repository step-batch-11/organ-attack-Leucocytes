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

/** Fresh per-Game monotonic id source for `GameEvent.id`, matching the `turnManager` default-collaborator pattern below. */
const makeEventIDGenerator = (): () => number => {
  let id = 0;
  return () => ++id;
};

export class Game {
  #players: Player[];
  #attackDeck: Deck<AttackCard>;
  #organsDeck: Deck<Organ>;
  #dealer: Dealer;
  #afflictionHandler: AfflictionHandler;
  #currentPlayer!: number;
  #event: GameEvent;
  #turnManager: TurnManager;
  #discardCounts: Map<number, number>;
  currentPlayedCard: boolean;
  #skipNextSleepDecrement: boolean;
  #nextEventID: () => number;

  constructor(
    players: Player[],
    attackCards: Deck<AttackCard>,
    organCards: Deck<Organ>,
    dealer: Dealer,
    afflictionHandler: AfflictionHandler,
    turnManager: TurnManager = new TurnManager(),
    eventIDGenerator: () => number = makeEventIDGenerator(),
  ) {
    this.#players = players;
    this.#attackDeck = attackCards;
    this.#organsDeck = organCards;
    this.#dealer = dealer;
    this.#afflictionHandler = afflictionHandler;
    this.#event = {} as GameEvent;
    this.#turnManager = turnManager;
    this.#discardCounts = new Map();
    this.currentPlayedCard = false;
    this.#skipNextSleepDecrement = false;
    this.#nextEventID = eventIDGenerator;
  }

  passTurn(): void {
    if (this.currentPlayedCard) {
      const skip = this.#skipNextSleepDecrement;
      this.#skipNextSleepDecrement = false;
      const { turn, discardedCards } = this.#turnManager.passTurn(skip);
      this.#currentPlayer = turn;
      discardedCards.forEach((card) => this.#attackDeck.addToDiscardPile(card));
      this.currentPlayedCard = false;
      this.#discardCounts.delete(this.#players[this.#currentPlayer].getID());
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

    // Instants (including self-played cryopreservation) never consume the
    // current player's turn on their own — only the current player actually
    // playing a non-instant card does, except Narcolepsy landing on the
    // current player, which cuts their turn short regardless of who played it.
    this.currentPlayedCard = this.currentPlayedCard ||
      isNarcolepsyPlayedOnMe ||
      (attackerID === playerID && !card.isInstant);

    if (isNarcolepsyPlayedOnMe) {
      this.#skipNextSleepDecrement = true;
    }
  }

  discardAttackCard(attackerID: number, attackCardID: number): AttackCard {
    const attacker = this.#findPlayer(attackerID);
    return this.#afflictionHandler.discardAttackCard(attacker, attackCardID);
  }

  /** Up to 2 discards (via `remove-card`) are allowed per player per turn. */
  canDiscardAttackCard(playerID: number): boolean {
    return (this.#discardCounts.get(playerID) ?? 0) < 2;
  }

  recordDiscard(playerID: number): void {
    this.#discardCounts.set(
      playerID,
      (this.#discardCounts.get(playerID) ?? 0) + 1,
    );
  }

  /**
   * A requester is only entitled to peek/discard from an opponent's hand
   * over `query-opponent-hand`/`audit-discard` while they still hold an
   * unplayed clinical-audit card — the client queries/discards for every
   * opponent *before* sending the `"action"` request that actually plays
   * (and discards) the card, so "holds the card" is the live signal for
   * "mid clinical-audit flow," not a per-target event registration.
   */
  hasActiveClinicalAudit(playerID: number): boolean {
    const player = this.#findPlayer(playerID);
    return player.getPlayerDetails().attackCards
      .some(({ action }) => action === "clinical-audit");
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
    const selectedCard = this.#attackDeck.getCardByID(selectedCardID);

    if (selectedCard === undefined) {
      throw new Error(
        `No card ${selectedCardID} in the discard pile to research`,
      );
    }

    player.removeAttackCard(researchCardID);
    player.refillHand(selectedCard);
  }

  removeOrgan(playerID: number, organCardID: number): void {
    const player = this.#findPlayer(playerID);
    const organ = player.removeOrgan(organCardID);
    this.#organsDeck.addToDiscardPile(organ);
  }

  // Cast preserves broken state: callers dereference the result without a
  // guard, so a missing id would already have thrown at runtime.
  #findPlayer(id: number): Player {
    const player = this.#players.find((player) => player.getID() === id);
    if (player === undefined) {
      throw new Error(`No player found with id ${id}`);
    }
    return player;
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
    return this.getPoisonHolderID() !== null;
  }

  /** At most one Poison card exists in the deck, so at most one player ever holds it at a time. */
  getPoisonHolderID(): number | null {
    const holder = this.#players.find((player) =>
      player.getPlayerDetails().attackCards.some(({ action }) =>
        action === "poison"
      )
    );
    return holder?.getID() ?? null;
  }

  /**
   * Auto-resolves a stalled Poison holder's turn against their own
   * first-held organ, mirroring what `GameController#handlePoison` does for
   * a manually-chosen one — discards the Poison card (drawing a
   * replacement, same as any other discard) and removes the default organ.
   * A no-op if the holder no longer actually holds Poison (e.g. it was
   * resolved normally right before this was scheduled to fire) or has no
   * organs left to remove.
   */
  forceResolvePoison(playerID: number): void {
    const player = this.#findPlayer(playerID);
    const { attackCards, organCards } = player.getPlayerDetails();
    const poisonCard = attackCards.find(({ action }) => action === "poison");

    if (poisonCard === undefined || organCards.length === 0) return;

    this.discardAttackCard(playerID, poisonCard.id);
    this.removeOrgan(playerID, organCards[0].id);
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
    this.#event = { ...event, id: this.#nextEventID() };
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
    const opponentHandSize = opponent.getPlayerDetails().attackCards.length;

    // Nothing to exchange for — leave the attacker's card in their hand
    // rather than removing it for no return.
    if (opponentHandSize === 0) return;

    // Was hardcoded to `* 5`, out of bounds (and throwing, since
    // Player#removeAttackCard now guards its index) for any opponent
    // holding fewer than 5 cards — routine well before a real game ends.
    const randomCardId = Math.floor(Math.random() * opponentHandSize);

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
