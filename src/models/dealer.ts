import type { Deck } from "./deck.ts";
import type { Player } from "./player.ts";
import type { Organ } from "./organ.ts";
import type { AttackCard } from "../types/cards.ts";

export class Dealer {
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

  #dealOrganCards(): void {
    this.#organCards.shuffleCards();
    const organCardsLimit = 4;
    const totalOrgansCount = organCardsLimit * this.#players.length;
    let dealtOrgansCount = 0;
    let isWildDealt = false;
    this.#players.forEach((player) => {
      const organCards = [];

      for (let i = 0; i < organCardsLimit; i++) {
        if (dealtOrgansCount === totalOrgansCount - 1 && !isWildDealt) {
          let organ = this.#organCards.getCard().getOrgan();
          while (!organ.isWild()) {
            organ = this.#organCards.getCard().getOrgan();
          }
          organCards.push(organ);
        } else {
          const card = this.#organCards.getCard();
          const organ = card.getOrgan();
          organCards.push(organ);
          isWildDealt = isWildDealt || organ.isWild();
        }
        dealtOrgansCount++;
      }

      player.fillHandWithOrgans(organCards);
    });
  }

  #isNormalAffliction({ action, afflictPoints }: AttackCard): boolean {
    return action === "affliction" && afflictPoints === 1;
  }

  dealAttackCards(): void {
    this.#attackCards.shuffleCards();
    const limit = 5;
    this.#players.forEach((player) => {
      const attackCards = [];
      const opponents = this.#players.filter((p) =>
        player.getID() !== p.getID()
      );
      while (attackCards.length < limit) {
        const card = this.#attackCards.getCard();
        if (
          this.#isNormalAffliction(card) &&
          !this.#canAfflictOpponents(card, opponents)
        ) {
          this.#attackCards.addToDiscardPile(card);
        } else {
          attackCards.push(card);
        }
      }

      player.fillHandWithAttacks(attackCards);
    });
  }

  dealCards(): void {
    this.#dealOrganCards();
    this.dealAttackCards();
  }
}
