export class AfflictionHandler {
  #attackCards;
  #organCards;

  constructor(attackCards, organCards) {
    this.#attackCards = attackCards;
    this.#organCards = organCards;
  }

  afflictOrganOfOpponent(opponent, organCardID) {
    const organ = opponent.afflictOrgan(organCardID);
    if (organ !== undefined) {
      this.#organCards.addToDiscardPile(organ);
    }
  }

  #doesEffectAnyOwnOrgan(attackCard, organCards) {
    return organCards.some(({ id }) =>
      attackCard.afflictableOrgans.includes(id)
    );
  }

  refillAttackCard(attacker) {
    const { organCards } = attacker.getPlayerDetails();
    const attackCard = this.#attackCards.getCard();
    if (this.#doesEffectAnyOwnOrgan(attackCard, organCards)) {
      const dummyCard = {
        "id": 100,
        "name": "Dummy",
        "isInstant": false,
        "afflictableOrgans": [
          1000,
        ],
        "removableOrgans": [],
        "isWild": true,
        "afflictPoints": 1,
        "Desc": "A Dummy Attack Card",
        "type": "dummy",
        "action": "affliction",
        "isBlockable": true,
      };
      attacker.refillHand(dummyCard);
      this.#attackCards.addToDiscardPile(attackCard);
    } else {
      attacker.refillHand(attackCard);
    }
  }

  discardAttackCard(attacker, attackCardID) {
    const attackCard = attacker.removeAttackCard(attackCardID);

    if (
      attackCard.action !== "transplant" && attackCard.action !== "its-alive"
    ) {
      this.#attackCards.addToDiscardPile(attackCard);
    }
    this.refillAttackCard(attacker);

    return attackCard;
  }
}
