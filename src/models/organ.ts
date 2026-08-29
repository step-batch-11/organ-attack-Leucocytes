import type { OrganCardData } from "../types/cards.ts";

export class Organ {
  #name: string;
  #id: number;
  #health: number;
  #maxHealth: number;

  constructor(name: string, id: number, health: number, maxHealth?: number) {
    this.#name = name;
    this.#id = id;
    this.#health = health;
    this.#maxHealth = maxHealth || health;
  }

  afflict(afflictionPoint?: number): void {
    this.#health -= afflictionPoint || 1;
  }

  heal(): void {
    this.#health = Math.min(this.#health + 1, this.#maxHealth);
  }

  isDead(): boolean {
    return this.#health <= 0;
  }

  isWild(): boolean {
    return this.#name.toLowerCase() === "wild";
  }

  getOrgan(): Organ {
    return this;
  }

  getID(): number {
    return this.#id;
  }

  getDetails(): OrganCardData {
    return {
      name: this.#name,
      id: this.getID(),
      health: this.#health,
      maxHealth: this.#maxHealth,
      isWild: this.isWild(),
    };
  }

  reAnimate(): void {
    this.#health = this.#maxHealth;
  }
}
