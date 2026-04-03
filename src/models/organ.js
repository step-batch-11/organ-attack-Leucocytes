export class Organ {
  #name;
  #id;
  #health;
  #maxHealth;

  constructor(name, id, health, maxHealth) {
    this.#name = name;
    this.#id = id;
    this.#health = health;
    this.#maxHealth = maxHealth;
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
      maxHealth: this.#maxHealth,
      isWild: this.isWild(),
    };
  }
}
