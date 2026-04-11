import { getCookie } from "hono/cookie";
import * as handlers from "./card_action_handler.js";
import { updateGameState } from "../app.js";
import { createEvent } from "../utils.js";

const ACTIONS = {
  transplant: handlers.handleTransplant,
  affliction: handlers.handleNormalAffliction,
  "chart-mixup": handlers.handleChartMixup,
  Vaccine: handlers.handleVaccine,
  medicine: handlers.handleMedicine,
  "medical-miracle": handlers.handleMedicalMiracle,
  "by-the-book": handlers.handleBythebook,
  poison: handlers.handlePoison,
  remove: handlers.handleRemoveOrgan,
  hybrid: handlers.handleHybridAffliction,
  itsAlive: handlers.handleItsAlive,
  sedate: handlers.handleSedate,
  narcolepsy: handlers.handleNarcolepsy,
  cryopreservation: handlers.handleCryopreservation,
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

  const currentPlayerID = game.getCurrentPlayerID();
  const currentPlayer = game.getPlayer(currentPlayerID);

  if (currentPlayer && currentPlayer.organCards.length === 0) {
    game.discardAttackHandOfPlayer(currentPlayerID);
    game.passTurn();
  }
  const gameState = game.getGameState();

  updateGameState(roomID, gameState);
  return c.json(res);
};

/*
{
  attackCardID: 11,
  organCardID: 4,
  attackerID: 1,
  opponentID: 2,
  isInstant: false
}

*/

export const handleAttack = async (c) => {
  const {
    attackerID,
    opponentID,
    attackCardID,
    organCardID,
    canRemove,
    organCardIDs,
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

  const event = createEvent(
    {
      opponentID,
      organCardID,
      action,
      attackerID,
      card: attackCard,
    },
    game,
  );
  game.registerEvent(event);

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
    organCardIDs,
  });

  const isSleepCard = [33, 34].includes(attackCardID);

  if (isSleepCard && attackerID !== game.getCurrentPlayerID()) {
    game.passTurn();
  }

  if (!attackCard.isInstant) {
    game.passTurn();
  }

  return res;
};

export const handleOpponentAudit = async (c) => {
  const { opponentID, attackCardID } = await c.req.json();
  const roomID = getCookie(c, "roomID");
  const games = c.get("games");
  const game = games[roomID];
  game.audit(opponentID, Number(attackCardID));

  const gameState = game.getGameState();

  updateGameState(roomID, gameState);

  return c.json({ success: true }, 200);
};
