export default class GameState {
  #state;
  constructor(state) {
    this.#state = state;
  }

  update(newState) {
    this.#state = newState;
  }

  isMyTurn() {
    return this.#state.self.isMyTurn && !this.amISleeping();
  }

  areOrgansAfflicted() {
    const { self } = this.#state;
    return self.organCards.some(({ maxHealth, health }) => health < maxHealth);
  }

  getAllOpponentOrgans() {
    const opponents = this.getOpponents();
    return opponents.flatMap(({ organCards }) => organCards);
  }

  getAfflictableOrgans(cardID) {
    const afflictableOrgans = this.#getAttackCardField(
      cardID,
      "afflictableOrgans",
    );

    const allOpponentOrgans = this.getAllOpponentOrgans();

    return allOpponentOrgans.filter(({ id }) =>
      afflictableOrgans.includes(id) || id === 100
    );
  }

  getRemovableOrgans(cardID) {
    const removableOrgans = this.#getAttackCardField(cardID, "removableOrgans");
    const allOpponentOrgans = this.getAllOpponentOrgans();

    return allOpponentOrgans.filter(({ id }) => removableOrgans.includes(id));
  }

  getPlayerWithOrgan(organID) {
    const { players } = this.#state;
    const player = players
      .find((player) => player.organCards.some(({ id }) => id === organID));

    return player?.id;
  }

  getSelfID() {
    return this.#state.self.id;
  }

  getOpponentID() {
    return this.#state.event.actor.id;
  }

  getOpponents() {
    const { players, self } = this.#state;
    return players.filter(({ id }) => id !== self.id);
  }

  getAttackedPlayerID() {
    return this.#state.event.target.player.id;
  }

  getCurrentDamagedOrgan() {
    return this.#state.event.target.organ.id;
  }

  getAfflictedOrgans() {
    const { self } = this.#state;
    return self.organCards.filter(({ maxHealth, health }) =>
      health < maxHealth
    );
  }

  amISleeping() {
    return this.#state.self.isSleeping;
  }

  #getAttackCardFlag(attackCardID, flag) {
    const { self } = this.#state;
    const attackCard = self.attackCards.find(({ id }) => id === attackCardID);
    return attackCard[flag];
  }

  #getAttackCardField(cardID, field) {
    const { self } = this.#state;
    const attackCard = self.attackCards.find(({ id }) => id === cardID);

    return attackCard !== undefined ? attackCard[field] : [];
  }

  isInstant(attackCardID) {
    return this.#getAttackCardFlag(attackCardID, "isInstant");
  }

  isCardActive(attackCardID) {
    return this.#getAttackCardFlag(attackCardID, "isActive");
  }

  canPlayContagious() {
    const { self, event } = this.#state;
    return !self.isSleeping &&
      self.id === event.target.player.id &&
      !event.resolved &&
      (event.name === "affliction" || event.name === "contagious");
  }

  canPlayImmunityBoost() {
    return this.#state.event.name !== "poison";
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

  getDiscardedOrgans() {
    return this.#state.organDiscardPile;
  }

  getPoisonID() {
    const { self } = this.#state;
    const poison = self.attackCards.find((card) => card.type === "poison");
    return poison.id;
  }

  snapshot() {
    return structuredClone(this.#state);
  }
}
