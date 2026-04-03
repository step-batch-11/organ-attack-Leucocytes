import { getCookie } from "hono/cookie";
import {
  handleChartMixup,
  handleNormalAffliction,
  handleVaccine,
} from "./card_action_handler.js";

const ACTIONS = {
  transplant: () => ({ success: true }),
  affliction: handleNormalAffliction,
  "chart-mixup": handleChartMixup,
  Vaccine: handleVaccine,
};

export const handleAttack = async (c) => {
  const {
    attackerID,
    opponentID,
    attackCardID,
    organCardID,
  } = await c.req.json();

  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];
  const attackCard = game.discardAttackCard(attackerID, attackCardID);
  const attackAction = attackCard.action;

  if (!(attackAction in ACTIONS)) {
    return c.json({ msg: "Invalid action" });
  }

  const handler = ACTIONS[attackAction];

  const res = handler({ attackerID, opponentID, organCardID, game });
  // console.log(res);

  return c.json(res);
};
