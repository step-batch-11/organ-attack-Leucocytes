export class Organ {
  #name;
  #id;
  #health;

  constructor(name, id, health) {
    this.#name = name;
    this.#id = id;
    this.#health = health;
  }

  afflict(afflictionPoint) {
    this.#health -= afflictionPoint;
  }

  heal() {
    this.#health += 1;
  }

  isDead() {
    return this.#health <= 0;
  }

  isWild() {
    return this.#name.toLowerCase() === "wild";
  }
  getOrgan() {
    return this;
  }
  getID() {
    return this.#id;
  }
  getDetails() {
    return {
      name: this.#name,
      id: this.getID(),
      health: this.#health,
      isWild: this.isWild(),
    };
  }
}
