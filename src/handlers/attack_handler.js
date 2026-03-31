import { getCookie } from "hono/cookie";

const handleNormalAffliction = (opponentID, organCardID, game) => {
  game.afflictOrganOfOpponent(opponentID, organCardID);
  return ({ success: true });
};

export const handleAttack = async (c) => {
  const actions = {
    transplant: "",
    affliction: handleNormalAffliction,
  };

  const { attackerID, opponentID, attackCardID, organCardID } = await c.req
    .json();

  const roomID = getCookie(c, "roomID");
  const game = c.get("games")[roomID];
  const attackCard = game.removeAttackFromAttacker(attackerID, attackCardID);

  const attackType = attackCard.type;
  const handler = actions[attackType];
  const res = handler(opponentID, organCardID, game);
  return c.json(res);
};
