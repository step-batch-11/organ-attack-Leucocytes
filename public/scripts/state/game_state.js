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
    // `event` starts as the server's empty initial object until the first
    // card is ever played this game — `event.target`/`event.actor` are
    // undefined until then, so guard before dereferencing.
    return !self.isSleeping &&
      event.target?.player?.id === self.id &&
      !event.resolved &&
      (event.name === "affliction" || event.name === "contagious");
  }

  canPlayImmunityBoost() {
    const { self, event } = this.#state;
    if (event.name === "poison" || event.name === "idle" || event.resolved) {
      return false;
    }
    // If the pending event names a specific target player, Immunity Boost
    // only blocks an attack actually aimed at you — otherwise any player in
    // the room could cancel an attack that was never targeting them.
    if (event.target?.player) {
      return event.target.player.id === self.id;
    }
    return true;
  }

  canPlayMetastasis() {
    const { self, event } = this.#state;
    return event.actor?.id === self.id && !event.resolved &&
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

  getAttackDiscardPile() {
    return this.#state.discardPile ?? [];
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
