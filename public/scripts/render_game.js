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

const setCardAttributes = (attackCard, { id, type, isInstant }) => {
  attackCard.setAttribute("data-id", id);
  attackCard.setAttribute("data-type", type);
  attackCard.setAttribute("id", `attack-${id}`);
  attackCard.setAttribute("is-instant", Number(isInstant));
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

const renderAttackCards = (attackCardNodes, attackCards, opponents) => {
  attackCardNodes.forEach((attackCard, i) => {
    const cardData = attackCards[i];
    setCardContent(attackCard, cardData);
    setCardAttributes(attackCard, cardData);
    checkCardDisabled(attackCard, cardData, opponents);
    addFlipEvent(attackCard);
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
  const playerAttacks = playerArea.querySelectorAll(".attack-card");

  setTextContent(playerArea, ".name", name);

  const avatar = playerArea.querySelector(".player");
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
  renderAttackCards(playerAttacks, attackCards, opponents);
};

const createOppFragment = (
  template,
  { name, organCards, id, isMyTurn, vaccinePoints },
) => {
  const clone = template.content.cloneNode(true);
  const element = clone.querySelector(".opponent");
  element.setAttribute("id", `player-${id}`);

  setTextContent(element, ".name", name);

  element.dataset.vaccine = vaccinePoints;
  renderOrgans(element, organCards);

  const avatar = clone.querySelector(".avatar");
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

const scaffoldFlashScreen = (actor, target, card) => {
  const flashScreen = cloneFromTemplate("#flash-screen-used-on-template");

  flashScreen.dataset["cardtype"] = card.type;

  const attackCard = flashScreen.querySelector(".attack-card");
  const targetContainer = flashScreen.querySelector(".target");
  const targetOrgan = targetContainer.querySelector(".organ");

  setTextContent(flashScreen, ".actor .name", actor);
  setTextContent(attackCard, " h1", card.name);
  setTextContent(targetContainer, ".name", target.playerName);

  attackCard.setAttribute("data-type", card.type);
  return { targetOrgan, flashScreen };
};

const flashScreenForUsedOnEvent = (actor, target, card) => {
  const { targetOrgan, flashScreen } = scaffoldFlashScreen(actor, target, card);

  renderOrganImage(targetOrgan, target.organName);
  return flashScreen;
};

const flashScreenForUsedEvent = (actor, target, card) => {
  const { flashScreen } = scaffoldFlashScreen(actor, target, card);
  flashScreen.querySelector(".target").remove();

  return flashScreen;
};
const flashScreenForUsedOnOrganEvent = (actor, target, card) => {
  const { targetOrgan, flashScreen } = scaffoldFlashScreen(actor, target, card);

  flashScreen.querySelector(".target .avatar").remove();
  renderOrganImage(targetOrgan, target.organName);

  return flashScreen;
};

const FLASH_SCREENS = {
  "hybrid": flashScreenForUsedOnEvent,
  "remove": flashScreenForUsedOnEvent,
  "affliction": flashScreenForUsedOnEvent,
  "Vaccine": flashScreenForUsedEvent,
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

const renderFlashScreen = ({ name, actor, target, card } = {}) => {
  document.querySelector(".flash-screen-container > div ")?.remove();

  if (!(name in FLASH_SCREENS)) {
    return;
  }
  const flashScreen = FLASH_SCREENS[name](actor, target, card);
  if (flashScreen instanceof HTMLElement) {
    document.querySelector(".flash-screen-container").appendChild(flashScreen);
  }
};

export const renderGame = async (gameState) => {
  const { event, players, self } = gameState;
  const opponents = players.filter(({ id }) => id !== self.id);

  renderOpponents(opponents);
  renderMyCards(self, opponents);
  renderFlashScreen(event);
};
