import {
  cloneFromTemplate,
  getAfflictableOrgans,
  getRemovableOrgans,
} from "./utils.js";

const setCardContent = (attackCard, { name, Desc }) => {
  const attackCardName = attackCard.querySelector("h1");
  const description = attackCard.querySelector(".card-desc");
  attackCardName.textContent = name;
  description.textContent = Desc;
};

const setCardAttributes = (attackCard, { id, type, isInstant, action }) => {
  attackCard.setAttribute("data-id", id);
  attackCard.setAttribute("data-type", type);
  attackCard.setAttribute("data-action", action);
  attackCard.setAttribute("id", `attack-${id}`);
  attackCard.setAttribute("is-instant", Number(isInstant)); // it should be data-isinstant
};

const checkCardDisabled = (attackCard, cardData, opponents) => {
  const organsToAttack = getAfflictableOrgans(opponents, cardData)
    .concat(getRemovableOrgans(opponents, cardData));
  const typeCheck = cardData.type === "affliction";

  if (organsToAttack.length === 0 && typeCheck) {
    attackCard.classList.add("disabled-card");
  } else {
    attackCard.classList.remove("disabled-card");
  }
};
const addFlipEvent = (attackCard) => {
  const infoBtns = attackCard.querySelectorAll(".info-btn");

  infoBtns.forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (attackCard.classList.contains("disabled-card")) return;

      attackCard.classList.toggle("flip");
    };
  });
};

const renderAttackCards = (attackCardsNode, attackCards, opponents) => {
  attackCardsNode.replaceChildren();

  attackCards.forEach((attackCard, i) => {
    const attackCardNode = cloneFromTemplate("#attack-cards");
    const cardData = attackCards[i];
    setCardContent(attackCardNode, cardData);
    setCardAttributes(attackCardNode, cardData);
    checkCardDisabled(attackCardNode, cardData, opponents);
    addFlipEvent(attackCardNode);
    attackCardsNode.append(attackCardNode);
  });
};

const renderOrganImage = (organ, name) => {
  const image = organ.querySelector("img");
  image.setAttribute("src", `/assets/organs/${String(name).toLowerCase()}.png`);
  image.setAttribute("alt", name);
  image.setAttribute("title", name);
};

const renderOrgans = (container, organCards) => {
  organCards.forEach(({ name, id, isWild, health }) => {
    const organ = cloneFromTemplate("#organ-card-template");
    renderOrganImage(organ, name);
    const maxHealth = isWild ? 4 : 2;
    organ.setAttribute("data-affliction", maxHealth - health);
    organ.setAttribute("data-id", id);
    organ.setAttribute("id", `organ-${id}`);
    container.append(organ);
  });
};

const renderMyCards = (
  { name, attackCards, organCards, isMyTurn, vaccinePoints },
  opponents,
) => {
  const playerArea = document.querySelector(".player-area");
  const playerOrganContainer = playerArea.querySelector(".organs");
  const attackCardContainer = document.querySelector(".attack-cards");

  setTextContent(playerArea, ".name", name);

  const isDead = organCards.length === 0 ? "true" : "false";
  const avatar = playerArea.querySelector(".player");
  avatar.setAttribute("data-is-alive", isDead);

  if (isMyTurn) {
    document.querySelector("body").style.background =
      "radial-gradient( gray, black )";
    avatar.classList.add("highlight-avatar");
  } else {
    document.querySelector("body").style.background =
      "radial-gradient(var(--bg-color), black)";
    avatar.classList.remove("highlight-avatar");
  }
  playerOrganContainer.dataset.vaccine = vaccinePoints;

  playerOrganContainer.innerHTML = "";
  renderOrgans(playerOrganContainer, organCards);
  renderAttackCards(attackCardContainer, attackCards, opponents);
};

const createOppFragment = (
  template,
  { name, organCards, id, isMyTurn, vaccinePoints },
) => {
  const clone = template.content.cloneNode(true);
  const element = clone.querySelector(".opponent");
  element.setAttribute("id", `player-${id}`);

  const isDead = organCards.length === 0 ? "true" : "false";

  element.setAttribute("data-is-alive", isDead);

  setTextContent(element, ".name", name);

  element.dataset.vaccine = vaccinePoints;
  renderOrgans(element, organCards);

  const avatar = clone.querySelector(".avatar");
  avatar.setAttribute("data-is-alive", isDead);

  if (isMyTurn) {
    avatar.classList.add("highlight-avatar");
  } else {
    avatar.classList.remove("highlight-avatar");
  }
  return element;
};

export const renderOpponents = (opponents) => {
  const template = document.querySelector(".opponent-template");
  const opponentArea = document.querySelector(".opponent-area");
  opponentArea.innerHTML = "";
  const fragments = opponents.map((opponent) => {
    return createOppFragment(template, opponent);
  });
  opponentArea.append(...fragments);
};

const setTextContent = (container, selector, content) => {
  container.querySelector(selector).textContent = content;
};

const scaffoldFlashScreen = ({ actor, target, card, timeRemaining }) => {
  const flashScreen = cloneFromTemplate("#flash-screen-used-on-template");

  flashScreen.dataset["cardtype"] = card.type;

  const attackCard = flashScreen.querySelector(".attack-card");
  const targetContainer = flashScreen.querySelector(".target");
  const targetOrgan = targetContainer.querySelector(".organ");
  const bar = flashScreen.querySelector(".bar");

  setTextContent(flashScreen, ".actor .name", actor);
  setTextContent(attackCard, " h1", card.name);
  setTextContent(targetContainer, ".name", target.playerName);

  attackCard.setAttribute("data-type", card.type);

  console.log(bar);
  bar.style.animationDuration = (timeRemaining ?? 5000) + "ms";
  setTimeout(() => {
    flashScreen.remove();
  }, timeRemaining ?? 5000);
  return { targetOrgan, flashScreen };
};

const flashScreenForUsedOnEvent = (eventData) => {
  const { targetOrgan, flashScreen } = scaffoldFlashScreen(eventData);

  renderOrganImage(targetOrgan, eventData.target.organName);
  return flashScreen;
};

const flashScreenForUsedEvent = (eventData) => {
  const { flashScreen } = scaffoldFlashScreen(eventData);
  flashScreen.querySelector(".target").remove();

  return flashScreen;
};

const flashScreenForUsedOnOrganEvent = (eventData) => {
  const { targetOrgan, flashScreen } = scaffoldFlashScreen(eventData);

  flashScreen.querySelector(".target .avatar").remove();
  renderOrganImage(targetOrgan, eventData.target.organName);

  return flashScreen;
};

const FLASH_SCREENS = {
  "hybrid": flashScreenForUsedOnEvent,
  "remove": flashScreenForUsedOnEvent,
  "affliction": flashScreenForUsedOnEvent,
  "Vaccine": flashScreenForUsedEvent,
  "immunity-boost": flashScreenForUsedEvent,
  "poison": flashScreenForUsedOnOrganEvent,
  "transplant": flashScreenForUsedOnEvent,
  "medicine": flashScreenForUsedOnOrganEvent,
  "chart-mixup": flashScreenForUsedEvent,
  "by-the-book": flashScreenForUsedEvent,
  "itsAlive": flashScreenForUsedOnOrganEvent,
  "sedate": flashScreenForUsedOnEvent,
  "narcolepsy": flashScreenForUsedOnEvent,
  "cryopreservation": flashScreenForUsedOnEvent,
  "clinical-audit": flashScreenForUsedEvent,
  "research": flashScreenForUsedEvent,
  "medical-miracle": flashScreenForUsedEvent,
};

const renderFlashScreen = ({ name, ...eventData } = {}) => {
  document.querySelector(".flash-screen-container > div ")?.remove();

  if (!(name in FLASH_SCREENS)) {
    return;
  }
  const flashScreen = FLASH_SCREENS[name](eventData);
  if (flashScreen instanceof HTMLElement) {
    document.querySelector(".flash-screen-container").appendChild(flashScreen);
  }
};

export const renderGame = () => {
  const gameState = window.gameState;
  const { event, players, self } = gameState.snapshot();
  const opponents = players.filter(({ id }) => id !== self.id);
  renderOpponents(opponents);
  renderMyCards(self, opponents);
  renderFlashScreen(event);
};
