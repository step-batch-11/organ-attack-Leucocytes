import { animateFromDeck, animateToDiscard } from "./animation.js";

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

export const getLastDiscardedCard = async () => {
  const res = await fetch("/discard-pile");
  const data = await res.json();
  if (!data || data.length === 0) return null;

  return data[data.length - 1];
};

export const postJSON = async (url, body) => {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if ((url === "/attack" || url === "/action") && lastPlayedCard) {
    await animateToDiscard(lastPlayedCard, rect);
    lastPlayedCard = null;
    rect = null;
  }
  return data;
};

export const fetchPlayersData = () => {
  const mockData = { player: [], opponents: [], playerID: null };

  return fetch("/game-state")
    .then((res) => res.json())
    .catch((err) => {
      console.error(err);
      return mockData;
    });
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
