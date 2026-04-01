export class Game {
  #players;
  #attackCards;
  #attacksDiscardPile;
  #organsDiscardPile;
  #organCards;
  #cardShuffler;
  #currentPlayer;

  constructor(players, attackCards, organCards, cardShuffler) {
    this.#players = players;
    this.#attackCards = attackCards;
    this.#organCards = organCards;
    this.#attacksDiscardPile = [];
    this.#organsDiscardPile = [];
    this.#cardShuffler = cardShuffler;
  }

  setFirstPlayer() {
    this.#currentPlayer = this.#players.findIndex((player) =>
      player.holdsWild()
    );
    return this.#currentPlayer;
  }

  #discardPlayersAttackCards() {
    this.#players.forEach((player) => {
      const attackCards = player.discardAttackCards();
      this.#attacksDiscardPile.push(...attackCards);
    });
  }

  #doesEffectAnyOwnOrgan(attackCard, organCards) {
    return organCards.some(({ id }) =>
      attackCard.afflictableOrgans.includes(id)
    );
  }

  distributeAttackCards() {
    this.#attackCards = this.#cardShuffler(this.#attackCards);
    const limit = 5;

    this.#players.forEach((player) => {
      const attackCards = [];
      let i = 0;
      const { organCards } = player.getPlayerDetails();
      while (attackCards.length < limit && i < this.#attackCards.length) {
        if (!this.#doesEffectAnyOwnOrgan(this.#attackCards[i], organCards)) {
          attackCards.push(...this.#attackCards.splice(i, 1));
        } else i++;
      }
      player.fillHandWithAttacks(attackCards);
    });
  }

  chartMixup() {
    this.#discardPlayersAttackCards();
    this.#attackCards.push(...this.#attacksDiscardPile.splice(0));
    this.distributeAttackCards();
  }

  distributeOrganCards() {
    this.#organCards = this.#cardShuffler(this.#organCards);

    const organCardsLimit = Math.floor(
      this.#organCards.length / this.#players.length,
    );

    this.#players.forEach((player) => {
      const organCards = this.#organCards.splice(0, organCardsLimit);
      player.fillHandWithOrgans(organCards);
    });
  }

  #findPlayer(id) {
    return this.#players.find((player) => player.getId() === id);
  }

  afflictOrganOfOpponent(opponentID, organCardID) {
    const opponent = this.#findPlayer(opponentID);
    const organ = opponent.afflictOrgan(organCardID);
    if (organ !== undefined) {
      this.#organsDiscardPile.push(organ);
    }
  }

  refillAttackCard(attacker) {
    if (this.#attackCards.length === 0) {
      const attackCard = {
        "id": 100,
        "name": "Dummy",
        "isInstant": false,
        "afflictableOrgans": [
          1000,
        ],
        "removableOrgans": [],
        "isWild": false,
        "afflictPoints": 1,
        "Desc": "A Dummy Attack Card",
        "type": "dummy",
        "action": "affliction",
        "isBlockable": true,
      };
      this.#attackCards.push(attackCard);
    }
    const attackCard = this.#attackCards.pop();
    attacker.refillHand(attackCard);
  }

  discardAttackCard(attackerID, attackCardID) {
    const attacker = this.#findPlayer(attackerID);
    const attackCard = attacker.removeAttackCard(attackCardID);
    this.#attacksDiscardPile.push(attackCard);
    this.refillAttackCard(attacker);
    this.#currentPlayer = ++this.#currentPlayer % this.#players.length;
    return attackCard;
  }

  distributeCards() {
    this.distributeOrganCards();
    this.distributeAttackCards();
  }

  getPlayers() {
    return this.#players.map((player) => {
      const { name, id, organCards } = player.getPlayerDetails();
      return { name, id, organCards, isMyTurn: this.#isPlayerTurn(id) };
    });
  }

  getOpponents(id) {
    return this.getPlayers().filter((player) => player.id !== id);
  }

  getPlayer(id) {
    const player = this.#findPlayer(id);
    return { ...player.getPlayerDetails(), isMyTurn: this.#isPlayerTurn(id) };
  }

  #isPlayerTurn(id) {
    const player = this.#players[this.#currentPlayer];
    return player === undefined ? false : player.getId() === id;
  }
}
