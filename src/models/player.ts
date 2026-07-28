import type { Organ } from "./organ.ts";
import type { AttackCard } from "../types/cards.ts";
import type { PlayerDetails } from "../types/entities.ts";

export class Player {
  #name: string;
  #id: number;
  #attackCards: AttackCard[];
  #organCards: Organ[];
  #type?: string;
  #vaccinePoints: number;
  sleepCount: number;
  constructor(name: string, id: number, type?: string) {
    this.#name = name;
    this.#id = id;
    this.#attackCards = [];
    this.#organCards = [];
    this.#type = type;
    this.#vaccinePoints = 0;
    this.sleepCount = 0;
  }

  isVaccinated(): boolean {
    return this.#vaccinePoints > 0;
  }

  isAlive(): boolean {
    return this.#organCards.length > 0;
  }

  applyVaccine(): void {
    this.#vaccinePoints += 2;
  }

  #decreaseVaccinePts(): void {
    this.#vaccinePoints -= 1;
  }

  fillHandWithOrgans(organCards: Organ[]): void {
    this.#organCards = organCards;
  }

  fillHandWithAttacks(attackCards: AttackCard[]): void {
    this.#attackCards = attackCards;
  }

  afflictOrgan(
    organCardID: number,
    afflictPoints?: number,
  ): { organ?: Organ; isDead: boolean } {
    if (this.isVaccinated()) {
      this.#decreaseVaccinePts();
      return { isDead: false };
    }

    // Cast preserves broken state: `find` may return undefined when the
    // targeted organ id is not held by this player, but the original code
    // dereferences it unconditionally.
    const organ = this.#organCards
      .find((organ) => organ.getID() === organCardID) as Organ;

    organ.afflict(afflictPoints);
    const organIndex = this.#organCards
      .findIndex((organ) => organ.getID() === organCardID);

    if (organ.isDead()) this.#organCards.splice(organIndex, 1);

    return { organ, isDead: organ.isDead() };
  }

  removeAttackCard(
    attackCardID: number | null,
    index?: number,
  ): AttackCard {
    const attackIndex = index || this.#attackCards
      .findIndex(({ id }) => id === attackCardID);
    const card = this.#attackCards.splice(attackIndex, 1);

    return card[0];
  }

  removeAttackCardIfOrganDead(organ: Organ): AttackCard[] {
    const cards: AttackCard[] = [];
    let i = 0;
    while (i < this.#attackCards.length) {
      const card = this.#attackCards[i];
      if (
        (card.afflictableOrgans.includes(organ.getID()) &&
          card.afflictableOrgans.length === 1) ||
        (card.removableOrgans.includes(organ.getID()) &&
          card.removableOrgans.length === 1)
      ) {
        const attackCard = this.removeAttackCard(card.id);
        cards.push(attackCard);
      } else i++;
    }
    return cards;
  }

  attackCardData(attackCardID: number): AttackCard {
    const card = this.#attackCards.find(({ id }) => id === attackCardID);
    return structuredClone(card) as AttackCard;
  }

  refillHand(attackCard: AttackCard): void {
    this.#attackCards.push(attackCard);
  }

  getID(): number {
    return this.#id;
  }

  holdsWild(): boolean {
    return this.#organCards.some((organ) => organ.isWild());
  }

  hasOrgan(name: string): boolean {
    return this.#organCards.some((organ) =>
      organ.getDetails().name.toLowerCase() === name
    );
  }

  addOrgan(organ: Organ): void {
    this.#organCards.push(organ);
  }

  removeOrgan(id: number): Organ {
    const index = this.#organCards.findIndex((card) => card.getID() === id);
    return this.#organCards.splice(index, 1)[0];
  }

  healOrgan(id: number): void {
    // Cast preserves broken state: organ may be undefined for an id not held.
    const organ = this.#organCards.find((card) => card.getID() === id) as Organ;
    organ.heal();
  }

  discardAllAttackCards(): AttackCard[] {
    return this.#attackCards.splice(0);
  }

  getPlayerDetails(): PlayerDetails {
    return {
      name: this.#name,
      id: this.#id,
      attackCards: [...this.#attackCards],
      organCards: [...this.#organCards.map((organ) => organ.getDetails())],
      vaccinePoints: this.#vaccinePoints,
      isSleeping: this.isSleeping(),
      isAlive: this.isAlive(),
    };
  }

  getNonAfflictedCards(): AttackCard[] {
    const cards = this.#attackCards.filter((card) =>
      card.type !== "affliction" && card.action !== "common-cold"
    );
    this.#attackCards = this.#attackCards.filter((card) =>
      card.type === "affliction" || card.action === "common-cold"
    );

    return cards;
  }

  isSleeping(): boolean {
    return this.sleepCount > 0;
  }

  applySleep(sleepPoints = 0): number {
    this.sleepCount += sleepPoints;
    return this.sleepCount;
  }

  decreaseSleep(): number {
    if (this.sleepCount > 0) this.sleepCount -= 1;
    return this.sleepCount;
  }

  discardAttackHand(): AttackCard[] {
    const cardsToDiscard = [...this.#attackCards];
    this.#attackCards.length = 0;
    return cardsToDiscard;
  }
}
