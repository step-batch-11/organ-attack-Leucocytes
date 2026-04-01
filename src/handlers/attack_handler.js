import { getCookie } from "hono/cookie";

const handleNormalAffliction = ({ opponentID, organCardID, game }) => {
  game.afflictOrganOfOpponent(opponentID, organCardID);
  return ({ success: true });
};

const handleChartMixup = ({ game }) => {
  game.chartMixup();
  return ({ success: true });
};

const ACTIONS = {
  transplant: "",
  "affliction": handleNormalAffliction,
  "chart-mixup": handleChartMixup,
};

export const handleAttack = async (c) => {
  const { attackerID, opponentID, attackCardID, organCardID } = await c.req
    .json();

  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];
  const attackCard = game.discardAttackCard(attackerID, attackCardID);
  const attackAction = attackCard.action;

  if (!(attackAction in ACTIONS)) {
    return c.json({ msg: "Invalid action" });
  }
  const handler = ACTIONS[attackAction];
  const res = handler({ opponentID, organCardID, game });
  return c.json(res);
};
