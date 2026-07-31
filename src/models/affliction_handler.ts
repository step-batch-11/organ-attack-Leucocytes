import type { Deck } from "./deck.ts";
import type { Player } from "./player.ts";
import type { Organ } from "./organ.ts";
import type { AttackCard } from "../types/cards.ts";

export class AfflictionHandler {
  #attackCards: Deck<AttackCard>;
  #organCards: Deck<Organ>;
  #players: Player[];

  constructor(
    attackCards: Deck<AttackCard>,
    organCards: Deck<Organ>,
    players: Player[],
  ) {
    this.#attackCards = attackCards;
    this.#organCards = organCards;
    this.#players = players;
  }

  #canAfflictOpponents(attackCard: AttackCard, opponents: Player[]): boolean {
    return opponents.some((opponent) => {
      const { organCards } = opponent.getPlayerDetails();
      return organCards.some(({ id }) =>
        attackCard.afflictableOrgans.includes(id) ||
        attackCard.removableOrgans.includes(id)
      );
    });
  }

  #isNormalAffliction({ action, afflictPoints }: AttackCard): boolean {
    return action === "affliction" && afflictPoints === 1;
  }

  refillAttackCard(attacker: Player): void {
    const opponents = this.#players.filter((player) =>
      player.getID() !== attacker.getID()
    );
    console.log(opponents);
    let attackCard = this.#attackCards.getCard();

    while (
      this.#isNormalAffliction(attackCard) &&
      !this.#canAfflictOpponents(attackCard, opponents)
    ) {
      console.log("I have ");
      this.#attackCards.addToDiscardPile(attackCard);
      attackCard = this.#attackCards.getCard();
    }
    attacker.refillHand(attackCard);
  }

  afflictOrganOfOpponent(
    opponent: Player,
    organCardID: number,
    afflictPoints?: number,
  ): void {
    const { organ, isDead } = opponent.afflictOrgan(organCardID, afflictPoints);

    if (isDead) this.#organCards.addToDiscardPile(organ as Organ);
  }

  discardAttackCard(attacker: Player, attackCardID: number): AttackCard {
    const attackCard = attacker.removeAttackCard(attackCardID);
    const cardTypes = ["its-alive", "transplant", "common-cold"];

    if (!cardTypes.includes(attackCard.action)) {
      this.#attackCards.addToDiscardPile(attackCard);
    }

    if (attackCard.action === "common-cold") attacker.refillHand(attackCard);
    else this.refillAttackCard(attacker);

    return attackCard;
  }
}
