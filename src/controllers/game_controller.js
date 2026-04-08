export default class GameController {
  #actionController;
  #timer;
  constructor(actionController, timer) {
    if (typeof actionController !== "object") {
      throw new Error("GameController requires valid ActionController");
    }
    this.#actionController = actionController;
    this.#timer = timer;
  }

  constructAction(
    { attackerID, attackCardID, isInstant, organCardID, opponentID },
    game,
  ) {
    // needs to be moved
    const card = game
      .discardAttackCard(attackerID, attackCardID, isInstant);

    const { action } = card;

    const actor = game.getPlayer(attackerID);

    const targetPlayer = opponentID ? game.getPlayer(opponentID) : "";

    console.log("if there is no error it should print", {
      attackCardID,
      attackerID,
      isInstant,
    });
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

    const res = this.#actionController.add(action);
    if (!res.success) throw new Error(res.message);

    return this.#timer.start();
  }

  #applyAction(game, action) {
    // has to call different cards action accordingly(needs validation)
    console.log(action);
    const { target } = action;
    const opponentID = target.player.id;
    const organCardID = target.organID;

    return game.afflictOrganOfOpponent(opponentID, organCardID);
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
