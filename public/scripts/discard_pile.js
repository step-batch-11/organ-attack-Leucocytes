import { clearPopup } from "./afflict-organ.js";
import { cloneFromTemplate, postJSON } from "./utils.js";

export const getTypes = (cards) => {
  const types = new Set();
  cards.forEach(({ type }) => {
    types.add(type);
  });

  return [...types];
};

const createList = (list) => {
  return list.map((type) => {
    const li = document.createElement("li");
    li.setAttribute("data-type", type);
    li.setAttribute("class", "list");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "choice";
    input.value = type;

    const label = document.createElement("label");
    label.textContent = type.toUpperCase();

    li.append(input, label);

    return li;
  });
};

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

const createCardNodes = (attackCards) =>
  attackCards.map((attackCard) => {
    const attackCardNode = cloneFromTemplate("#attack-cards");
    setCardContent(attackCardNode, attackCard);
    setCardAttributes(attackCardNode, attackCard);
    addFlipEvent(attackCardNode);
    return attackCardNode;
  });

const addListener = async (popup, cards, researchID, playerID) => {
  const checkboxes = popup.querySelectorAll("input[name='choice']");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const selectedCheckboxes = popup
        .querySelectorAll("input[name='choice']:checked");

      const selectedTypes = [...selectedCheckboxes].map(({ value }) => value);

      const filteredCards = cards
        .filter(({ type }) => selectedTypes.includes(type));

      const cardNodes = createCardNodes(filteredCards);
      const leftPanel = popup.querySelector("#left-panel");
      leftPanel.replaceChildren(...cardNodes);
    });
  });

  const leftPanel = popup.querySelector("#left-panel");
  leftPanel.onclick = async (e) => {
    const selectedCardID = Number(
      e.target.closest(".attack-card").getAttribute("data-id"),
    );

    clearPopup();

    return await postJSON("/action", {
      attackCardID: researchID,
      selectedCardID,
      attackerID: playerID,
    });
  };
};

export const displayAttackDeckDiscardPile = async (
  { player, attackCardID },
) => {
  clearPopup();
  const response = await fetch("/discard-pile");
  const cards = await response.json();
  const popup = document.querySelector("body .popup");
  const template = cloneFromTemplate("#research-template");
  const types = getTypes(cards);
  const list = createList(types);
  const typeList = template.querySelector("#types-list");
  typeList.append(...list);
  popup.append(template);
  await addListener(popup, cards, attackCardID, player.id);
};
