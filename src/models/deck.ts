import type { Shuffle } from "../types/context.ts";

/**
 * A generic pile of cards backed by a drawing pile and a discard pile.
 *
 * The `Deck` is used for both attack cards (plain objects with an `id`) and
 * organ cards ({@link Organ} instances exposing `getID()`). The element type
 * is therefore left loose (`any`) to preserve the current mixed usage.
 */
// deno-lint-ignore no-explicit-any
export class Deck<T = any> {
  #drawingPile: T[];
  #discardPile: T[];
  #shuffle: Shuffle;

  constructor(cards: T[], shuffler: Shuffle) {
    this.#drawingPile = cards;
    this.#discardPile = [];
    this.#shuffle = shuffler;
  }

  shuffleCards(): void {
    this.#drawingPile = this.#shuffle(this.#drawingPile);
  }

  refillDrawingPile(): void {
    this.#drawingPile.push(...this.#discardPile);
    this.#discardPile.length = 0;
  }

  getCard(): T {
    if (this.#drawingPile.length === 0) this.refillDrawingPile();
    return this.#drawingPile.pop() as T;
  }

  addToDiscardPile(card: T): void {
    this.#discardPile.push(card);
  }

  removeFromDiscardPile(cardID: number): void {
    // deno-lint-ignore no-explicit-any
    const index = this.#discardPile.findIndex((card: any) =>
      card.id === cardID
    );
    this.#discardPile.splice(index, 1);
  }

  getDrawingPile(): T[] {
    return [...this.#drawingPile];
  }

  getDiscardPile(): T[] {
    return [...this.#discardPile];
  }

  getCardFromDiscardPile(id: number): T | -1 {
    // deno-lint-ignore no-explicit-any
    const card = this.#discardPile.find((card: any) => card.getID() === id);

    if (card === undefined) return -1;

    // deno-lint-ignore no-explicit-any
    this.#discardPile = this.#discardPile.filter((card: any) =>
      card.getID() !== id
    );
    return card;
  }

  getCardByID(cardID: number): T | undefined {
    // deno-lint-ignore no-explicit-any
    return this.#discardPile.find((card: any) => card.id === cardID);
  }
}
