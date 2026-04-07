export default class GameController {
  #actionController;
  constructor(actionController) {
    if (typeof actionController !== "object") {
      throw new Error("GameController requires valid ActionController");
    }
    this.#actionController = actionController;
  }

  constructAction(
    { attackerID, attackCardID, isInstant, organCardID, opponentID },
    game,
  ) {
    const card = game
      .discardAttackCard(attackerID, attackCardID, isInstant);

    const { action } = card;
    const actor = game.getPlayer(attackerID);
    const targetPlayer = game.getPlayer(opponentID);

    return {
      name: action.toUpperCase().split("-").join("_"),
      actor,
      target: { player: targetPlayer, organID: organCardID },
      card,
    };
  }

  playCard(action) {
    if (typeof action !== "object") {
      throw new Error("requires a action to play a card");
    }

    return this.#actionController.add(action);
  }

  #applyActions(game, actions) {
    actions.forEach((action) => {
      game.apply(action);
    });
  }

  resolveAction(game) {
    const result = this.#actionController.resolve();
    if (!result.success) {
      return { success: false, message: result.message };
    }
    const applicableActions = result.data;
    this.#applyActions(game, applicableActions);
    return { success: true };
  }
}
