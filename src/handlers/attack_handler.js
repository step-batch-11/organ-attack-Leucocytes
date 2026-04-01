import { getCookie } from "hono/cookie";

const handleNormalAffliction = ({ opponentID, organCardID, game }) => {
  game.afflictOrganOfOpponent(opponentID, organCardID);
  return ({ success: true });
};

const ACTIONS = {
  transplant: "",
  affliction: handleNormalAffliction,
};

export const handleAttack = async (c) => {
  const { attackerID, opponentID, attackCardID, organCardID } = await c.req
    .json();

  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];
  const attackCard = game.removeAttackFromAttacker(attackerID, attackCardID);

  const attackType = attackCard.type;
  const handler = ACTIONS[attackType];
  const res = handler({ opponentID, organCardID, game });
  return c.json(res);
};
