export class Dealer {
  #attackCards;
  #organCards;
  #players;

  constructor(attackCards, organCards, players) {
    this.#attackCards = attackCards;
    this.#organCards = organCards;
    this.#players = players;
  }

  #doesEffectAnyOwnOrgan(attackCard, organCards) {
    return organCards.some(({ id }) => {
      return attackCard.afflictableOrgans.includes(id) ||
        attackCard.removableOrgans.includes(id);
    });
  }

  #dealOrganCards() {
    this.#organCards.shuffleCards();
    const organCardsLimit = Math.floor(
      this.#organCards.getDrawingPile().length / this.#players.length,
    );

    this.#players.forEach((player) => {
      const organCards = [];
      for (let i = 0; i < organCardsLimit; i++) {
        const organ = this.#organCards.getCard().getOrgan();
        organCards.push(organ);
      }

      player.fillHandWithOrgans(organCards);
    });
  }

  dealAttackCards() {
    this.#attackCards.shuffleCards();
    const limit = 5;
    this.#players.forEach((player) => {
      const attackCards = [];
      const { organCards } = player.getPlayerDetails();
      while (attackCards.length < limit) {
        const card = this.#attackCards.getCard();

        if (this.#doesEffectAnyOwnOrgan(card, organCards)) {
          this.#attackCards.addToDiscardPile(card);
        } else {
          attackCards.push(card);
        }
      }
      player.fillHandWithAttacks(attackCards);
    });
  }

  dealCards() {
    this.#dealOrganCards();
    this.dealAttackCards();
  }
}
