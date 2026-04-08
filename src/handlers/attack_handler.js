import { getCookie } from "hono/cookie";
import * as handlers from "./card_action_handler.js";

import { updateGameState } from "../app.js";

const ACTIONS = {
  transplant: handlers.handleTransplant,
  affliction: handlers.handleNormalAffliction,
  "chart-mixup": handlers.handleChartMixup,
  Vaccine: handlers.handleVaccine,
  medicine: handlers.handleMedicine,
  "by-the-book": handlers.handleBythebook,
  poison: handlers.handlePoison,
  remove: handlers.handleRemoveOrgan,
  hybrid: handlers.handleHybridAffliction,
  itsAlive: handlers.handleItsAlive,
  "sedate": handlers.handleSedate,
  "narcolepsy": handlers.handleNarcolepsy,
  "cryopreservation": handlers.handleCryopreservation,
  "common-cold": handlers.handleCommonCold,
  "clinical-audit": handlers.handleRefillSelfPostAudit,
  research: handlers.handleResearch,
  "situs-inversus": handlers.handleSitusInversus,
};

export const resolveAction = async (c) => {
  const res = await handleAttack(c);

  /**
   * create new handle attack: pass as variable not ctx
   * pull normal affliction into it
   * handle immunity boost using action controller
   */

  if (!res.success) return c.json({ message: res.message }, 400);

  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];

  const gameState = game.getGameState();

  updateGameState(gameState);
  return c.json(res);
};

export const handleAttack = async (c) => {
  const {
    attackerID,
    opponentID,
    attackCardID,
    organCardID,
    // _isInstant,
    canRemove,
    selectedCardID,
  } = await c.req.json();
  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];

  const attackCard = game.discardAttackCard(
    attackerID,
    attackCardID,
  );
  const { action, afflictPoints } = attackCard;

  if (!(action in ACTIONS)) {
    return { message: "Invalid action" };
  }

  const target = {};

  if (action === "poison") {
    target.targetOrgan = game.getPlayer(attackerID)
      .organCards.find(({ id }) => id === organCardID);
  }

  const handler = ACTIONS[action];

  const res = handler({
    attackerID,
    opponentID,
    organCardID,
    attackCardID,
    game,
    afflictPoints,
    canRemove,
    selectedCardID,
  });
  const banana = [33, 34].includes(attackCardID);
  if (banana && attackerID !== game.getCurrentPlayerID()) {
    game.passTurn();
  }

  if (!attackCard.isInstant) {
    game.passTurn();
  }

  registerEvent(
    {
      opponentID,
      target,
      game,
      organCardID,
      action,
      attackerID,
      attackCard,
    },
  );

  return res;
};

const registerEvent = (
  { opponentID, target, game, organCardID, action, attackerID, attackCard },
) => {
  if (opponentID) {
    target.targetPlayer = game.getPlayer(opponentID);
    target.targetOrgan = target.targetPlayer
      .organCards.find(({ id }) => id === organCardID);
  }

  const { targetPlayer, targetOrgan } = target;

  const event = {
    name: action,
    actor: game.getPlayer(attackerID).name,
    target: {
      playerName: targetPlayer?.name,
      organName: targetOrgan?.name,
    },
    card: attackCard,
  };

  game.registerEvent(event);
};

export const handleOpponentAudit = async (c) => {
  const { opponentID, attackCardID } = await c.req.json();
  const roomID = getCookie(c, "roomID");
  const games = c.get("games");
  const game = games[roomID];
  game.audit(opponentID, Number(attackCardID));

  const gameState = game.getGameState();

  updateGameState(gameState);

  return c.json({ success: true }, 200);
};
