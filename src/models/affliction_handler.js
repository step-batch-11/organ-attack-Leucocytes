export class AfflictionHandler {
  #attackCards;
  #organCards;

  constructor(attackCards, organCards) {
    this.#attackCards = attackCards;
    this.#organCards = organCards;
  }

  afflictOrganOfOpponent(opponent, organCardID, afflictPoints) {
    const { organ, isDead } = opponent.afflictOrgan(organCardID, afflictPoints);

    if (isDead) this.#organCards.addToDiscardPile(organ);
  }

  #doesEffectAnyOwnOrgan(attackCard, organCards) {
    return organCards
      .some(({ id }) => attackCard.afflictableOrgans.includes(id));
  }

  refillAttackCard(attacker) {
    const { organCards } = attacker.getPlayerDetails();
    let attackCard = this.#attackCards.getCard();

    while (this.#doesEffectAnyOwnOrgan(attackCard, organCards)) {
      this.#attackCards.addToDiscardPile(attackCard);
      attackCard = this.#attackCards.getCard();
    }

    attacker.refillHand(attackCard);
  }

  discardAttackCard(attacker, attackCardID) {
    const attackCard = attacker.removeAttackCard(attackCardID);
    const cardTypes = ["its-alive", "transplant", "common-cold"];

    if (!cardTypes.includes(attackCard.action)) {
      this.#attackCards.addToDiscardPile(attackCard);
    }

    if (attackCard.action === "common-cold") attacker.refillHand(attackCard);
    else this.refillAttackCard(attacker);

    return attackCard;
  }
}
