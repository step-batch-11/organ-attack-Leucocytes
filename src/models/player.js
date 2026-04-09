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
    this.sleepCount = 0;
  }

  isVaccinated() {
    return this.#vaccinePoints > 0;
  }

  isAlive() {
    return this.#organCards.length > 0;
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

  afflictOrgan(organCardID, afflictPoints) {
    if (this.isVaccinated()) {
      this.#decreaseVaccinePts();
      return { isDead: false };
    }

    const organ = this.#organCards
      .find((organ) => organ.getID() === organCardID);

    organ.afflict(afflictPoints);
    const organIndex = this.#organCards
      .findIndex((organ) => organ.getID() === organCardID);

    if (organ.isDead()) this.#organCards.splice(organIndex, 1);

    return { organ, isDead: organ.isDead() };
  }

  removeAttackCard(attackCardID, index) {
    const attackIndex = index || this.#attackCards
      .findIndex(({ id }) => id === attackCardID);
    const card = this.#attackCards.splice(attackIndex, 1);

    return card[0];
  }

  attackCardData(attackCardID) {
    const card = this.#attackCards.find(({ id }) => id === attackCardID);
    return structuredClone(card);
  }

  refillHand(attackCard) {
    this.#attackCards.push(attackCard);
  }

  getID() {
    return this.#id;
  }

  holdsWild() {
    return this.#organCards.some((organ) => organ.isWild());
  }

  hasOrgan(name) {
    return this.#organCards.some((organ) =>
      organ.getDetails().name.toLowerCase() === name
    );
  }

  addOrgan(organ) {
    this.#organCards.push(organ);
  }

  removeOrgan(id) {
    const index = this.#organCards.findIndex((card) => card.getID() === id);
    return this.#organCards.splice(index, 1)[0];
  }

  healOrgan(id) {
    const organ = this.#organCards.find((card) => card.getID() === id);
    organ.heal();
  }

  discardAllAttackCards() {
    return this.#attackCards.splice(0);
  }

  getPlayerDetails() {
    return {
      name: this.#name,
      id: this.#id,
      attackCards: [...this.#attackCards],
      organCards: [...this.#organCards.map((organ) => organ.getDetails())],
      vaccinePoints: this.#vaccinePoints,
      isSleeping: this.isSleeping(),
    };
  }

  getNonAfflictedCards() {
    const cards = this.#attackCards.filter((card) =>
      card.type !== "affliction" && card.action !== "common-cold"
    );
    this.#attackCards = this.#attackCards.filter((card) =>
      card.type === "affliction" || card.action === "common-cold"
    );

    return cards;
  }

  isSleeping() {
    return this.sleepCount > 0;
  }

  applySleep(sleepPoints = 0) {
    this.sleepCount += sleepPoints;
    return this.sleepCount;
  }

  decreaseSleep() {
    if (this.sleepCount > 0) this.sleepCount -= 1;
    return this.sleepCount;
  }

  discardAttackHand() {
    this.#attackCards.length = 0;
  }
}
