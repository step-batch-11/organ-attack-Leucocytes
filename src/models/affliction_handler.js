export class AfflictionHandler {
  #attackCards;
  #organCards;
  #players;

  constructor(attackCards, organCards, players) {
    this.#attackCards = attackCards;
    this.#organCards = organCards;
    this.#players = players;
  }

  #canAfflictOpponents(attackCard, opponents) {
    return opponents.some((opponent) => {
      const { organCards } = opponent.getPlayerDetails();
      return organCards.some(({ id }) =>
        attackCard.afflictableOrgans.includes(id) ||
        attackCard.removableOrgans.includes(id)
      );
    });
  }

  #isNormalAffliction({ action, afflictPoints }) {
    return action === "affliction" && afflictPoints === 1;
  }

  refillAttackCard(attacker) {
    const opponents = this.#players.filter((player) =>
      player.getID() !== attacker.getID()
    );
    console.log(opponents);
    let attackCard = this.#attackCards.getCard();

    while (
      this.#isNormalAffliction(attackCard) &&
      !this.#canAfflictOpponents(attackCard, opponents)
    ) {
      console.log("I have ");
      this.#attackCards.addToDiscardPile(attackCard);
      attackCard = this.#attackCards.getCard();
    }
    attacker.refillHand(attackCard);
  }

  afflictOrganOfOpponent(opponent, organCardID, afflictPoints) {
    const { organ, isDead } = opponent.afflictOrgan(organCardID, afflictPoints);

    if (isDead) this.#organCards.addToDiscardPile(organ);
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
