export class Player {
  #name;
  #id;
  #attackCards;
  #organCards;
  #type;
  #vaccinePoints;
  constructor(name, id, type) {
    this.#name = name;
    this.#id = id;
    this.#attackCards = [];
    this.#organCards = [];
    this.#type = type;
    this.#vaccinePoints = 0;
  }
  isVaccinated() {
    return this.#vaccinePoints > 0;
  }

  applyVaccine() {
    this.#vaccinePoints += 2;
  }

  #decreaseVaccinePts() {
    this.#vaccinePoints -= 1;
  }

  fillHandWithOrgans(organCards) {
    this.#organCards = organCards;
  }

  fillHandWithAttacks(attackCards) {
    this.#attackCards = attackCards;
  }

  #isOrganDead(organ) {
    return organ.health <= 0;
  }

  afflictOrgan(organCardID) {
    if (this.isVaccinated()) {
      this.#decreaseVaccinePts();
      return;
    }
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

  addOrgan(organ) {
    this.#organCards.push(organ);
  }

  removeOrgan(id) {
    const index = this.#organCards.findIndex((card) => card.id === id);
    return this.#organCards.splice(index, 1)[0];
  }

  healOrgan(id) {
    const organ = this.#organCards.find((card) => card.id === id);
    organ.health += 1;
  }

  discardAllAttackCards() {
    return this.#attackCards.splice(0);
  }

  getPlayerDetails() {
    return {
      name: this.#name,
      id: this.#id,
      attackCards: [...this.#attackCards],
      organCards: [...this.#organCards],
      vaccinePoints: this.#vaccinePoints,
    };
  }
}
