export default class GameState {
  #state;
  constructor(state) {
    this.#state = state;
  }

  update(newState) {
    this.#state = newState;
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

  getOpponentID() {
    return this.#state.event.actor.id;
  }

  getAttackedPlayerID() {
    return this.#state.event.target.player.id;
  }

  getCurrentDamagedOrgan() {
    return this.#state.event.target.organ.id;
  }

  #getAttackCardFlag(attackCardID, flag) {
    const { self } = this.#state;
    const attackCard = self.attackCards.find(({ id }) => id === attackCardID);
    return attackCard[flag];
  }

  isInstant(attackCardID) {
    return this.#getAttackCardFlag(attackCardID, "isInstant");
  }

  isCardActive(attackCardID) {
    return this.#getAttackCardFlag(attackCardID, "isActive");
  }

  canPlayContagious() {
    const { self, event } = this.#state;
    return self.id === event.target.player.id && !event.resolved &&
      (event.name === "affliction" || event.name === "contagious");
  }

  canPlayMetastasis() {
    const { self, event } = this.#state;
    return self.id === event.actor.id && !event.resolved &&
      event.name === "affliction";
  }

  getPlayerOrgans(playerID) {
    const { players } = this.#state;
    const player = players.find(({ id }) => id === playerID);
    return structuredClone(player.organCards);
  }

  getUnharmedOrgan(playerID, organID) {
    const organCards = this.getPlayerOrgans(playerID);
    return organCards.filter(({ id }) => id !== organID);
  }

  snapshot() {
    return structuredClone(this.#state);
  }
}
