import { getCookie } from "hono/cookie";
import {
  handleBythebook,
  handleChartMixup,
  handleMedicine,
  handleNormalAffliction,
  handlePoison,
  handleTransplant,
  handleVaccine,
} from "./card_action_handler.js";

import { updateGameState } from "../app.js";
const ACTIONS = {
  transplant: handleTransplant,
  affliction: handleNormalAffliction,
  "chart-mixup": handleChartMixup,
  Vaccine: handleVaccine,
  medicine: handleMedicine,
  "by-the-book": handleBythebook,
  "poison": handlePoison,
};

export const resolveAction = async (c) => {
  const res = await handleAttack(c);

  if (!res.success) return c.json({ message: res.message }, 400);

  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];

  const gameState = game.getGameState();

  updateGameState(gameState);
  return c.json(res);
};

export const handleAttack = async (c) => {
  const { attackerID, opponentID, attackCardID, organCardID, isInstant } =
    await c.req.json();

  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];
  const attackCard = game.discardAttackCard(
    attackerID,
    attackCardID,
    isInstant,
  );
  const { action, afflictPoints } = attackCard;

  if (!(action in ACTIONS)) {
    return { message: "Invalid action" };
  }

  const handler = ACTIONS[action];
  const res = handler({
    attackerID,
    opponentID,
    organCardID,
    game,
    afflictPoints,
  });

  const target = {};
  if (action === "affliction") {
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

  return res;
};
