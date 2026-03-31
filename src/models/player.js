export class Player {
  #name;
  #id;
  #attackCards;
  #organCards;
  #type;
  constructor(name, id, type) {
    this.#name = name;
    this.#id = id;
    this.#attackCards = [];
    this.#organCards = [];
    this.#type = type;
  }

  fillHand(attackCards, organCards) {
    this.#attackCards = attackCards;
    this.#organCards = organCards;
  }

  #isOrganDead(organ) {
    return organ.health <= 0;
  }

  afflictOrgan(organCardID) {
    const organIndex = this.#organCards
      .findIndex(({ id }) => id === organCardID);
    const organ = this.#organCards[organIndex];
    organ.health -= 1;
    if (this.#isOrganDead(organ)) {
      this.#organCards.splice(organIndex, 1);
      return organ;
    }
  }

  removeAttackCard(attackCardID) {
    const attackIndex = this.#attackCards
      .findIndex(({ id }) => id === attackCardID);
    return (this.#attackCards.splice(attackIndex, 1))[0];
  }

  refillHand(attackCard) {
    this.#attackCards.push(attackCard);
  }

  getId() {
    return this.#id;
  }

  holdsWild() {
    return this.#organCards.some((organ) => organ.isWild);
  }

  getPlayerDetails() {
    return {
      name: this.#name,
      id: this.#id,
      attackCards: [...this.#attackCards],
      organCards: [...this.#organCards],
      hasWild: this.holdsWild(),
    };
  }
}
