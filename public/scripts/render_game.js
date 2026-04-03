import {
  cloneFromTemplate,
  getAfflictableOrgans as getOrganList,
} from "./utils.js";

const renderAttackCards = (attackCardNodes, attackCards, opponents) => {
  attackCardNodes.forEach((attackCard, i) => {
    const { name, id, type, isInstant } = attackCards[i];
    const attackCardName = attackCard.querySelector("h1");
    attackCardName.textContent = name;

    attackCard.setAttribute("data-id", id);
    attackCard.setAttribute("data-type", type);
    attackCard.setAttribute("id", `attack-${id}`);

    const organsToAttack = getOrganList({ attackCards }, opponents, id);
    const typeCheck = !(["bureaucracy", "resistance"].includes(type));

    if (organsToAttack.length === 0 && typeCheck) {
      attackCard.classList.add("disabled-card");
    } else {
      attackCard.classList.remove("disabled-card");
    }
  });
};

const renderOrganImage = (organ, name) => {
  const image = organ.querySelector("img");
  image.setAttribute("src", `/assets/organs/${name.toLowerCase()}.png`);
  image.setAttribute("alt", name);
  image.setAttribute("title", name);
};

const renderOrgans = (organNodes, organCards) => {
  organNodes.forEach((organ, i) => {
    if (organCards[i] !== undefined) {
      const { name, id, isWild, health } = organCards[i];
      renderOrganImage(organ, name);

      const maxHealth = isWild ? 4 : 2;
      organ.setAttribute("data-affliction", maxHealth - health);
      organ.setAttribute("data-id", id);
      organ.setAttribute("id", `organ-${id}`);
    } else organ.remove();
  });
};

const renderMyCards = (
  { name, attackCards, organCards, isMyTurn },
  opponents,
) => {
  const playerArea = document.querySelector(".player-area");
  const playerOrgans = playerArea.querySelectorAll(".organ");
  const playerAttacks = playerArea.querySelectorAll(".attack-card");

  console.log({ playerArea, playerOrgans, playerAttacks });
  setTextContent(playerArea, ".name", name);
  console.log("Mee", isMyTurn);

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

  renderOrgans(playerOrgans, organCards);
  renderAttackCards(playerAttacks, attackCards, opponents);
};

const createOppFragment = (
  template,
  { name, organCards, id, isMyTurn, vaccinePoints },
) => {
  console.log(vaccinePoints);
  const clone = template.content.cloneNode(true);
  const element = clone.querySelector(".opponent");
  element.setAttribute("id", `player-${id}`);

  setTextContent(element, ".name", name);
  if (vaccinePoints === 2) {
    element.classList.add("vacced");
  }
  if (vaccinePoints === 1) {
    element.classList.remove("vacced");
    element.classList.add("vacced-half");
  }
  if (vaccinePoints === 0) {
    element.classList.remove("vacced-half");
  }
  const organs = element.querySelectorAll(".organ");
  renderOrgans(organs, organCards);

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
    console.log("opp", opponent);
    return createOppFragment(template, opponent);
  });
  opponentArea.append(...fragments);
};

const setTextContent = (container, selector, content) => {
  console.log({ container, selector, content });

  container.querySelector(selector).textContent = content;
};

const renderFlashScreen = ({ name, actor, target, card }) => {
  if (name === "idle" || name === undefined) {
    document.querySelector(".flash-screen")?.remove();
    return;
  }
  const flashScreen = cloneFromTemplate("#flash-screen-affliction-template");

  const attackCard = flashScreen.querySelector(".attack-card");
  const targetContainer = flashScreen.querySelector(".target");
  const targetOrgan = targetContainer.querySelector(".organ");

  setTextContent(flashScreen, ".actor .name", actor);
  setTextContent(attackCard, " h1", card.name);
  setTextContent(targetContainer, ".name", target.playerName);

  renderOrganImage(targetOrgan, target.organName);
  attackCard.setAttribute("data-type", "affliction");

  document.querySelector("main").appendChild(flashScreen);
};

// for testing......
const mockEventData = {
  name: "idle",
  actor: "Player1",
  target: {
    playerName: "player2",
    organName: "Teeth",
  },
  card: {
    name: "Scalding coffee",
    isInstant: false,
    "isWild": false,
    "Desc": "Scalding coffee affecting organs",
    "type": "affliction",
  },
};

export const renderGame = async ({ player, opponents, event }) => {
  renderOpponents(opponents);
  renderMyCards(player, opponents);
  renderFlashScreen(event || mockEventData);
};
