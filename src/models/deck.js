export class Deck {
  #drawingPile;
  #discardPile;
  #shuffle;

  constructor(cards, shuffler) {
    this.#drawingPile = cards;
    this.#discardPile = [];
    this.#shuffle = shuffler;
  }

  shuffleCards() {
    this.#drawingPile = this.#shuffle(this.#drawingPile);
  }

  refillDrawingPile() {
    this.#drawingPile.push(...this.#discardPile);
    this.#discardPile.length = 0;
  }

  getCard() {
    if (this.#drawingPile.length === 0) this.refillDrawingPile();
    return this.#drawingPile.pop();
  }

  addToDiscardPile(card) {
    this.#discardPile.push(card);
  }

  getDrawingPile() {
    return [...this.#drawingPile];
  }

  getDiscardPile() {
    return [...this.#discardPile];
  }

  getCardFromDiscardPile(id) {
    const card = this.#discardPile.find((card) => card.getID() === id);

    if (card === undefined) return -1;

    this.#discardPile = this.#discardPile.filter((card) => card.getID() !== id);
    return card;
  }
}
