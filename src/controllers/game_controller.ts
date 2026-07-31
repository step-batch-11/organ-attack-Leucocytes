import type ActionController from "./action_controller.ts";
import type Timer from "../models/timer.ts";
import type { Game } from "../models/game.ts";
import type { ActionInput } from "../types/entities.ts";
import type { ActionResult } from "../types/game.ts";

type ActionHandler = (game: Game, action: ActionInput) => unknown;

export default class GameController {
  #actionController: ActionController;
  #timer: Timer;
  #ACTIONS: Record<string, ActionHandler>;

  // the game should be in the constructor
  constructor(actionController: ActionController, timer: Timer) {
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
      transplant: this.#handleTransplant,
      "medical-miracle": this.#handleMedicalMiracle,
      "itsAlive": this.#handleItsAlive,
      "Vaccine": this.#handleVaccine,
      "common-cold": this.#handleCommonCold,
      "sedate": this.#handleSedate,
      "chart-mixup": this.#handleChartMixup,
      "by-the-book": this.#handleBythebook,
      "situs-inversus": this.#handleSitusInversus,
      "narcolepsy": this.#handleNarcolepsy,
      "research": this.#handleResearch,
      "medicine": this.#handleMedicine,
      "cryopreservation": this.#handleCryopreservation,
      "clinical-audit": this.#handleClinicalAudit,
    };
  }

  updateEventStatus(game: Game): void {
    const remainingTime = this.#timer.remaining();
    game.updateEventStatus(remainingTime);
  }

  playCard(action: ActionInput): Promise<ActionResult> {
    if (typeof action !== "object") {
      throw new Error("requires a action to play a card");
    }

    const res = this.#actionController.add(action);
    if (!res.success) throw new Error(res.message);

    const done = this.#timer.start();

    // Non-blockable cards have no response window to wait out — resolve
    // the pending timer immediately instead of holding the stack open.
    if (action.card?.isBlockable === false) {
      this.#timer.end();
    }

    return done;
  }

  #handleResearch(
    game: Game,
    { attackCardID, attackerID, selectedCardID }: ActionInput,
  ) {
    game.research(
      attackerID as number,
      selectedCardID as number,
      attackCardID as number,
    );
    game.removeFromDiscardPile(selectedCardID as number);
    return { success: true };
  }

  #handleMedicine(game: Game, { attackerID, organCardID }: ActionInput) {
    game.healOrgan(attackerID as number, organCardID as number);
    return ({ success: true });
  }

  #handleSedate(game: Game, { opponentID }: ActionInput) {
    const sleepCount = game.applySedate(opponentID as number);
    return { success: sleepCount > 0 };
  }

  #handleCommonCold(
    game: Game,
    { attackerID, attackCardID, opponentID }: ActionInput,
  ) {
    game.exchangeCard(
      attackerID as number,
      attackCardID as number,
      opponentID as number,
    );
    return ({ success: true });
  }

  #handleAffliction(
    game: Game,
    { opponentID, organCardID, card }: ActionInput,
  ) {
    const { removableOrgans } = card;
    const afflictionPoints = (removableOrgans.includes(organCardID as number) ||
        card.type === "necrosis")
      ? 2
      : 1;

    return game.afflictOrganOfOpponent(
      opponentID as number,
      organCardID as number,
      afflictionPoints,
    );
  }

  #handleCryopreservation(game: Game, { attackerID }: ActionInput) {
    const result = game.applyCryopreservation(attackerID as number);
    return result;
  }

  #handleVaccine(game: Game, { attackerID }: ActionInput) {
    game.applyVaccine(attackerID as number);
    return ({ success: true });
  }

  #handleTransplant = (
    game: Game,
    { attackerID, opponentID, organCardID }: ActionInput,
  ) => {
    game.transplantOrgan(
      attackerID as number,
      opponentID as number,
      organCardID as number,
    );
    return ({ success: true });
  };

  #handleNarcolepsy(game: Game, { opponentID }: ActionInput) {
    game.applyNarcolepsy(opponentID as number);

    return { success: true };
  }

  #handlePoison(game: Game, { attackerID, organCardID }: ActionInput) {
    game.removeOrgan(attackerID as number, organCardID as number);
    return ({ success: true });
  }

  #handleMedicalMiracle(
    game: Game,
    { attackerID, organCardIDs }: ActionInput,
  ) {
    (organCardIDs as number[]).forEach((organCardID) => {
      game.healOrgan(attackerID as number, organCardID);
    });

    return ({ success: true });
  }

  #handleChartMixup(game: Game) {
    game.chartMixup();
    return ({ success: true });
  }

  #handleBythebook(game: Game) {
    game.bythebook();
    return ({ success: true });
  }

  // The opponent-hand reveal/discard for clinical-audit is driven by
  // separate "query-opponent-hand"/"audit-discard" WS requests, not this
  // dispatch table — this entry only exists so every card has one, and so
  // playCard's non-blockable fast path applies to it.
  #handleClinicalAudit() {
    return ({ success: true });
  }

  #handleItsAlive(game: Game, { attackerID, organCardID }: ActionInput) {
    const organ = game.itsAlive(attackerID as number, organCardID as number);
    // Cast preserves broken state: `itsAlive` returns -1 when the discarded
    // organ id isn't found, but the original code dereferences it unconditionally.
    return { success: !((organ as { isDead(): boolean }).isDead()) };
  }

  #handleSitusInversus(game: Game) {
    game.exchangeHeartAndLungs();
    game.changeOrderOfPlay();

    return ({ success: true });
  }

  #applyAction(game: Game, action: ActionInput): unknown {
    // has to call different cards action accordingly(needs validation)
    const { action: cardAction } = action.card;
    if (!(cardAction in this.#ACTIONS)) {
      return { success: false };
    }

    return this.#ACTIONS[cardAction](game, action);
    // ---
  }

  #applyActions(game: Game, actions: ActionInput[]): void {
    actions.forEach((action) => {
      this.#applyAction(game, action);
    });
    // should be rich in validation
    if (actions[0]?.card.action === "poison") return;
    game.passTurn();
  }

  resolveAction(game: Game): ActionResult {
    const result = this.#actionController.resolve();

    if (!result.success) return { success: false, message: result.message };

    const applicableActions = result.data as ActionInput[];
    this.#applyActions(game, applicableActions);

    return { success: true };
  }

  resolveNow(): void {
    this.#timer.end();
  }
}
