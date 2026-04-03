import { getCookie } from "hono/cookie";
import {
  handleChartMixup,
  handleMedicine,
  handleNormalAffliction,
  handleTransplant,
  handleVaccine,
} from "./card_action_handler.js";

const ACTIONS = {
  transplant: handleTransplant,
  affliction: handleNormalAffliction,
  "chart-mixup": handleChartMixup,
  Vaccine: handleVaccine,
  medicine: handleMedicine,
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
  const attackAction = attackCard.action;

  if (!(attackAction in ACTIONS)) {
    return c.json({ msg: "Invalid action" });
  }

  const handler = ACTIONS[attackAction];

  const res = handler({ attackerID, opponentID, organCardID, game });
  // console.log(res);

  return c.json(res);
};
