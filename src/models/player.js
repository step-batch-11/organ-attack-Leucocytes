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
