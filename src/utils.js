import { getCookie } from "hono/cookie";

export const counter = () => {
  let i = 0;
  return () => ++i;
};

export const getPlayerID = (c) => {
  const sessionID = getCookie(c, "sessionID");

  if (sessionID === undefined) return -1;

  const session = c.get("session");
  return session[sessionID];
};

const getOrganName = (organCards, organCardID) => {
  if (organCardID === undefined) return;

  const organCard = organCards.find(({ id }) => id === organCardID);

  if (typeof organCard === "object") {
    return organCard.name;
  }
};

const extractTargetData = ({ player, game, opponentID, organCardID }) => {
  const target = {};

  if (opponentID) {
    const opponent = game.getPlayer(opponentID);
    target.playerName = opponent.name;
    target.organName = getOrganName(opponent.organCards, organCardID);
  }

  if (organCardID && !target.organName) {
    const playerOrgan = player.organCards;
    const discardedOrgan = game.getOrganDiscardPile();
    target.organName = getOrganName(
      [...playerOrgan, ...discardedOrgan],
      organCardID,
    );
  }

  return target;
};

export const createEvent = (eventData, game) => {
  const { card, attackerID } = eventData;
  const player = game.getPlayer(attackerID);
  const target = extractTargetData({ player, game, ...eventData });

  return {
    name: card.action,
    actor: player.name,
    target,
    card,
  };
};
