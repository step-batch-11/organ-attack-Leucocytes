export default class GameState {
  #state;
  constructor(state) {
    this.#state = state;
  }

  #applyEventToAttackCards() {
    const { event } = this.#state;
    if (event.resolved || event.resolved === undefined) return;

    const attackCards = this.#state.self.attackCards;
    attackCards.forEach((attackCard) => {
      const action = attackCard.action;
      if (action !== "immunity-boost") {
        attackCard.action = "disabled";
      }
    });
  }

  update(newState) {
    this.#state = newState;
    this.#applyEventToAttackCards();
  }

  isMyTurn() {
    return this.#state.self.isMyTurn;
  }

  getAfflictableOrgans(cardID) {
    const { self, players } = this.#state;
    const attackCard = self.attackCards.find(({ id }) => id === cardID);

    const afflictableOrgans = attackCard !== undefined
      ? attackCard.afflictableOrgans
      : [];

    const opponents = players.filter(({ id }) => id !== self.id);

    return opponents.flatMap(({ organCards }) => organCards)
      .filter(({ id }) => afflictableOrgans.includes(id) || id === 100);
  }

  getPlayerWithOrgan(organID) {
    const { players } = this.#state;
    const player = players
      .find((player) => player.organCards.some(({ id }) => id === organID));

    return player.id;
  }

  getSelfID() {
    return this.#state.self.id;
  }

  isInstant(attackCardID) {
    const { self } = this.#state;
    const attackCard = self.attackCards.find(({ id }) => id === attackCardID);
    return attackCard.isInstant;
  }

  snapshot() {
    return structuredClone(this.#state);
  }
}
