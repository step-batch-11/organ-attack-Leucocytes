import { getAvatarClosure } from "./avatar.js";
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
const createOrganImg = (id) => {
  const organ = document.createElement("div");
  const image = document.createElement("img");
  image.src = `/assets/organs/${id}.png`;
  organ.append(image);
  return organ;
};

const setTargetOrgans = (container, organs) => {
  const organsImage = organs.map((id) => createOrganImg(id));
  container.append(...organsImage);
};

const setTargetInfo = (attackCard, afflicts, removes) => {
  const targetInfo = cloneFromTemplate("#attack-card-target");
  const targetContainer = attackCard.querySelector(".target-info-container");
  const afflictsContainer = targetInfo.querySelector(".afflicts > div");
  const removesContainer = targetInfo.querySelector(".removes > div");
  setTargetOrgans(afflictsContainer, afflicts);
  setTargetOrgans(removesContainer, removes);
  if (afflicts.length <= 0) targetInfo.querySelector(".afflicts")?.remove();
  if (removes.length <= 0) targetInfo.querySelector(".removes")?.remove();
  targetContainer.append(targetInfo);
};

const setCardIndicators = (attackCard, cardData) => {
  const { isInstant, type, afflictableOrgans, removableOrgans } = cardData;
  const typeIndicator = attackCard.querySelector(".type");
  typeIndicator.setAttribute("src", `/assets/icons/${type}.png`);

  if (type === "affliction") {
    setTargetInfo(attackCard, afflictableOrgans, removableOrgans);
  }
  if (!isInstant) return;
  const instant = attackCard.querySelector(".instant");
  console.log(instant);
  instant.setAttribute("src", "/assets/icons/fire.png");
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
    setCardIndicators(attackCardNode, cardData);
    attackCardsNode.append(attackCardNode);
  });
};

const renderOrganImage = (organ, name, id) => {
  const image = organ.querySelector("img");
  image.setAttribute("src", `/assets/organs/${id}.png`);
  image.setAttribute("alt", name);
  image.setAttribute("title", name);
};

const renderOrgans = (container, organCards) => {
  organCards.forEach(({ name, id, isWild, health }) => {
    const organ = cloneFromTemplate("#organ-card-template");
    renderOrganImage(organ, name, id);
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
  const profile = playerArea.querySelector(".avatar");
  renderPlayerProfile(name, profile);
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

const renderPlayerProfile = (name, avatarContainer) => {
  const getAvatarURL = getAvatarClosure();
  const avatarUrl = getAvatarURL(name);
  avatarContainer.style.backgroundImage = `url(${avatarUrl})`;
};

const createOppFragment = (
  template,
  { name, organCards, id, isMyTurn, vaccinePoints },
  position,
) => {
  const clone = template.content.cloneNode(true);
  const element = clone.querySelector(".opponent");
  element.dataset.position = position;
  element.setAttribute("id", `player-${id}`);

  const isDead = organCards.length === 0 ? "true" : "false";

  element.setAttribute("data-is-alive", isDead);

  setTextContent(element, ".name", name);

  element.dataset.vaccine = vaccinePoints;
  renderOrgans(element, organCards);

  const avatar = clone.querySelector(".avatar");
  renderPlayerProfile(name, avatar);

  avatar.setAttribute("data-is-alive", isDead);

  if (isMyTurn) {
    avatar.classList.add("highlight-avatar");
  } else {
    avatar.classList.remove("highlight-avatar");
  }
  return element;
};

const opponentPos = (i, spacer) => Math.floor((i + 1) * spacer);

export const renderOpponents = (opponents) => {
  const template = document.querySelector(".opponent-template");
  const opponentArea = document.querySelector(".opponent-area");
  opponentArea.innerHTML = "";

  const offset = opponents.length === 3 ? 0.2 : 0.15;
  const opponentSpacer = (6 / (opponents.length + 1)) + offset;
  const fragments = opponents.map((opponent, i) => {
    const position = opponentPos(i, opponentSpacer);
    return createOppFragment(template, opponent, position);
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
  const avatar = flashScreen.querySelector(".actor .avatar");
  const targetAvatar = flashScreen.querySelector(".target .avatar");
  renderPlayerProfile(actor.name, avatar);
  renderPlayerProfile(target.player?.name, targetAvatar);

  setTextContent(flashScreen, ".actor .name", actor.name);
  setTextContent(attackCard, " h1", card.name);
  setTextContent(targetContainer, ".name", target.player?.name);

  attackCard.setAttribute("data-type", card.type);

  bar.style.animationDuration = (timeRemaining ?? 5000) + "ms";
  setTimeout(() => {
    flashScreen.remove();
  }, timeRemaining ?? 5000);
  return { targetOrgan, flashScreen };
};

const flashScreenForUsedOnEvent = (eventData) => {
  const { targetOrgan, flashScreen } = scaffoldFlashScreen(eventData);

  renderOrganImage(targetOrgan, eventData.target.organ?.name);
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
  renderOrganImage(targetOrgan, eventData.target.organ?.name);

  return flashScreen;
};

const FLASH_SCREENS = {
  "hybrid": flashScreenForUsedOnEvent,
  "remove": flashScreenForUsedOnEvent,
  "affliction": flashScreenForUsedOnEvent,
  "contagious": flashScreenForUsedOnEvent,
  "metastasis": flashScreenForUsedOnEvent,
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

export const renderGame = async (isAlive) => {
  const gameState = window.gameState;
  const { event, players, self } = gameState.snapshot();
  const livingPlayers = players.filter((player) => player.isAlive);
  console.log("self", self);

  if (livingPlayers.length === 1) {
    const page = isAlive ? "pages/winner.html" : "pages/looser.html";
    window.location.replace(page);
  }
  const opponents = players.filter(({ id }) => id !== self.id);
  renderOpponents(opponents);
  renderMyCards(self, opponents);
  renderFlashScreen(event);
};
