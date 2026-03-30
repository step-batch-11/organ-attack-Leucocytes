export class Player {
  #name;
  #id;
  #attackCards;
  #organCards;
  constructor(name, id) {
    this.#name = name;
    this.#id = id;
    this.#attackCards = [];
    this.#organCards = [];
  }

  fillHand(attackCards, organCards) {
    this.#attackCards = attackCards;
    this.#organCards = organCards;
  }

  getId() {
    return this.#id;
  }

  getPlayerDetails() {
    return {
      name: this.#name,
      id: this.#id,
      attackCards: [...this.#attackCards],
      organCards: [...this.#organCards],
    };
  }
}
