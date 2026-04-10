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

const getOrganDetails = (organCards, organCardID) => {
  if (organCardID === undefined) return;

  const organCard = organCards.find(({ id }) => id === organCardID);

  if (typeof organCard === "object") {
    return { name: organCard.name, id: organCardID };
  }
};

const extractTargetData = ({ player, game, opponentID, organCardID }) => {
  const target = {};

  if (opponentID) {
    const opponent = game.getPlayer(opponentID);
    const player = {
      name: opponent.name,
      id: opponentID,
    };
    target.player = player;
    target.organ = getOrganDetails(opponent.organCards, organCardID);
  }

  if (organCardID && !target.organ) {
    const playerOrgan = player.organCards;
    const discardedOrgan = game.getOrganDiscardPile();
    target.organ = getOrganDetails(
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
    actor: { name: player.name, id: attackerID },
    target,
    card,
  };
};
