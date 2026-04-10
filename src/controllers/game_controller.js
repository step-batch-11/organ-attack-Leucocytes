export default class GameController {
  #actionController;
  #timer;
  #ACTIONS;

  // the game should be in the constructor
  constructor(actionController, timer) {
    if (typeof actionController !== "object") {
      throw new Error("GameController requires valid ActionController");
    }
    this.#actionController = actionController;
    this.#timer = timer;

    this.#ACTIONS = {
      affliction: this.#handleAffliction,
      contagious: this.#handleAffliction,
      metastasis: this.#handleAffliction,
      poison: this.#handlePoison,
      "medical-miracle": this.#handleMedicalMiracle,
    };
  }

  updateEventStatus(game) {
    const remainingTime = this.#timer.remaining();
    game.updateEventStatus(remainingTime);
  }

  playCard(action) {
    if (typeof action !== "object") {
      throw new Error("requires a action to play a card");
    }

    const res = this.#actionController.add(action);
    if (!res.success) throw new Error(res.message);

    return this.#timer.start();
  }

  #handleAffliction(game, { opponentID, organCardID, card }) {
    const { removableOrgans } = card;
    const afflictionPoints =
      (removableOrgans.includes(organCardID) || card.type === "necrosis")
        ? 2
        : 1;

    return game.afflictOrganOfOpponent(
      opponentID,
      organCardID,
      afflictionPoints,
    );
  }

  #handlePoison(game, { attackerID, organCardID }) {
    game.removeOrgan(attackerID, organCardID);
    return ({ success: true });
  }

  #handleMedicalMiracle(game, { attackerID, organCardIDs }) {
    organCardIDs.forEach((organCardID) => {
      game.healOrgan(attackerID, organCardID);
    });

    return ({ success: true });
  }

  #applyAction(game, action) {
    // has to call different cards action accordingly(needs validation)
    const { action: cardAction } = action.card;
    if (!(cardAction in this.#ACTIONS)) {
      return { success: false };
    }

    return this.#ACTIONS[cardAction](game, action);
    // ---
  }

  #applyActions(game, actions) {
    actions.forEach((action) => {
      this.#applyAction(game, action);
    });
    // should be rich in validation
    game.passTurn();
  }

  resolveAction(game) {
    const result = this.#actionController.resolve();

    if (!result.success) return { success: false, message: result.message };

    const applicableActions = result.data;
    this.#applyActions(game, applicableActions);

    return { success: true };
  }
}
