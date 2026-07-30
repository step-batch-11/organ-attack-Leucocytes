import { animateFromDeck, animateToDiscard } from "./animation.js";
import { sendRequest } from "./network.js";

export const getAfflictableOrgans = (opponents, attackCard) => {
  const afflictableOrgansIDs = attackCard.afflictableOrgans;

  const allOrganCards = opponents.reduce((allCards, { organCards, id }) => {
    organCards.forEach((card) => card.playerID = id);
    return allCards.concat(organCards);
  }, []);

  if (attackCard.isWild || attackCard.id === 19) return allOrganCards;

  return allOrganCards.filter(({ id }) =>
    afflictableOrgansIDs.includes(id) || id === 100
  );
};

export const getRemovableOrgans = (opponents, { removableOrgans }) => {
  for (const { organCards } of opponents) {
    for (const organ of organCards) {
      if (removableOrgans.includes(organ.id)) return [organ];
    }
  }
  return [];
};

export const cloneFromTemplate = (templateID, element = "*") => {
  const template = document.querySelector(templateID);
  return template.content.cloneNode(true).querySelector(element);
};

let lastPlayedCard = null;
let rect = null;
let lastPlayedCardData = null;

export const setLastPlayedCard = (card, cardPos, cardData) => {
  lastPlayedCard = card;
  rect = cardPos;
  lastPlayedCardData = cardData;
};

/** Plays a card via the WS "action" request, then discards it to the pile. */
export const sendAction = async (body) => {
  const data = await sendRequest("action", body);

  if (lastPlayedCard) {
    await animateToDiscard(lastPlayedCard, rect);
    lastPlayedCard = null;
    rect = null;
  }
  return data;
};

export const setOrganImage = (organ, name, id) => {
  const image = organ.querySelector("img");
  image.setAttribute("src", `/assets/organs/${id}.png`);
  image.setAttribute("alt", name);
  image.setAttribute("title", name);
};

export const createAttackCardElement = (cardData) => {
  const card = document
    .querySelector("#attack-cards")
    .content.cloneNode(true)
    .querySelector(".attack-card");
  console.log("data", cardData);

  card.dataset.id = cardData.id;
  card.setAttribute("data-type", cardData.type);

  card.querySelector(".card-front h1").textContent = cardData.name;
  card.querySelector(".card-desc").textContent = cardData.description;

  card.setAttribute("is-instant", cardData.isInstant ? 1 : 0);

  return card;
};
