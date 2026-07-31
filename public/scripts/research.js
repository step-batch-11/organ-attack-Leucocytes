import { cloneFromTemplate } from "./utils.js";

const fetchDiscardAttackPile = async () => {
  return [
    {
      "id": 1,
      "name": "Conjunctivitis",
      "isInstant": false,
      "afflictableOrgans": [
        11,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Conjunctivitis affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 2,
      "name": "Hyperspleenism!",
      "isInstant": false,
      "afflictableOrgans": [
        10,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Hyperspleenism! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 5,
      "name": "Enamel Erosion!",
      "isInstant": false,
      "afflictableOrgans": [
        5,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Enamel Erosion! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 6,
      "name": "Heart Attack!",
      "isInstant": false,
      "afflictableOrgans": [
        7,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Heart Attack! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 7,
      "name": "Kindey Donor!",
      "isInstant": false,
      "afflictableOrgans": [
        1,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Kindey Donor! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 8,
      "name": "Arrhythmia!",
      "isInstant": false,
      "afflictableOrgans": [
        7,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Arrhythmia! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 9,
      "name": "Foreign Object in Eye!",
      "isInstant": false,
      "afflictableOrgans": [
        11,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Foreign Object in Eye! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 10,
      "name": "Cirrhosis",
      "isInstant": false,
      "afflictableOrgans": [
        12,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Cirrhosis affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 11,
      "name": "Scalding coffee",
      "isInstant": false,
      "afflictableOrgans": [
        4,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Scalding coffee affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 13,
      "name": "Love",
      "isInstant": false,
      "afflictableOrgans": [
        7,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Love affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 14,
      "name": "Vomit!",
      "isInstant": false,
      "afflictableOrgans": [
        2,
        4,
        5,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Vomit! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 15,
      "name": "Hepatospleenomegaly!",
      "isInstant": false,
      "afflictableOrgans": [
        10,
        12,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Hepatospleenomegaly! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 16,
      "name": "Urinary Tract Infection!",
      "isInstant": false,
      "afflictableOrgans": [
        1,
      ],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Urinary Tract Infection! affecting organs",
      "type": "affliction",
      "action": "affliction",
      "isBlockable": true,
    },
    {
      "id": 17,
      "name": "Chart mixup",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Chart mixup",
      "action": "chart-mixup",
      "type": "bureaucracy",
      "isBlockable": false,
    },
    {
      "id": 19,
      "name": "Transplant",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 0,
      "Desc": "Transplant",
      "action": "transplant",
      "type": "tactical",
      "isBlockable": true,
    },
    {
      "id": 18,
      "name": "Vaccine",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 0,
      "Desc": "Vaccine",
      "action": "Vaccine",
      "type": "resistance",
      "isBlockable": true,
    },
    {
      "id": 20,
      "name": "Wild !",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": true,
      "afflictPoints": 1,
      "Desc": "Can afflict any organ",
      "action": "affliction",
      "type": "wild",
      "isBlockable": true,
    },
    {
      "id": 21,
      "name": "Instant Wild 🔥",
      "isInstant": true,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": true,
      "afflictPoints": 1,
      "Desc": "Can afflict any organ",
      "action": "affliction",
      "type": "instant wild",
      "isBlockable": true,
    },
    {
      "id": 22,
      "name": "Medicine",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 0,
      "Desc": "Can afflict any organ",
      "action": "medicine",
      "type": "cure",
      "isBlockable": true,
    },
    {
      "id": 23,
      "name": "By the Book",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 0,
      "Desc": "Discard all non afflictions",
      "action": "by-the-book",
      "type": "bureaucracy",
      "isBlockable": false,
    },
    {
      "id": 24,
      "name": "Necrosis",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": true,
      "afflictPoints": 2,
      "Desc": "Removes an organ",
      "action": "affliction",
      "type": "necrosis",
      "isBlockable": true,
    },
    {
      "id": 25,
      "name": "Poison",
      "isInstant": true,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": true,
      "afflictPoints": 2,
      "Desc": "Removes an own organ",
      "action": "poison",
      "type": "poison",
      "isBlockable": true,
    },

    {
      "id": 26,
      "name": "Removes Heart",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [7],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Removes heart",
      "action": "remove",
      "type": "affliction",
      "isBlockable": true,
    },
    {
      "id": 27,
      "name": "Removes kidney",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [
        1,
      ],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Removes Kidney",
      "action": "remove",
      "type": "affliction",
      "isBlockable": true,
    },
    {
      "id": 28,
      "name": "Afflicts Kidney or Removes Spleen",
      "isInstant": false,
      "afflictableOrgans": [
        1,
      ],
      "removableOrgans": [
        10,
      ],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Removes kidney or spleen",
      "action": "hybrid",
      "type": "affliction",
      "isBlockable": true,
    },
    {
      "id": 29,
      "name": "Afflicts Tongue or Removes Teeth",
      "isInstant": false,
      "afflictableOrgans": [
        4,
      ],
      "removableOrgans": [
        5,
      ],
      "isWild": false,
      "afflictPoints": 1,
      "Desc": "Removes heart",
      "action": "hybrid",
      "type": "affliction",
    },
    {
      "id": 30,
      "name": "it's Alive",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 0,
      "Desc": "can bring back any dead organ",
      "action": "itsAlive",
      "type": "tactical",
      "isBlockable": true,
    },
    {
      "id": 31,
      "name": "Sedate",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 0,
      "Desc": "Causes extreme sleep for two turn",
      "action": "sedate",
      "type": "tactical",
      "isBlockable": false,
    },
    {
      "id": 32,
      "name": "Necrosis 🔥 ",
      "isInstant": true,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": true,
      "afflictPoints": 2,
      "Desc": "Removes an organ",
      "action": "affliction",
      "type": "necrosis",
      "isBlockable": true,
    },
    {
      "id": 53,
      "name": "Research",
      "isInstant": false,
      "afflictableOrgans": [],
      "removableOrgans": [],
      "isWild": false,
      "afflictPoints": 0,
      "Desc": "Reseach from the discarded attack cards and get the cards",
      "action": "research",
      "type": "bureaucracy",
      "isBlockable": false,
    },
  ];
};

const getTypes = (cards) => {
  const types = new Set();
  cards.forEach(({ type }) => {
    types.add(type);
  });

  return [...types];
};

// const createList = (list) => {
//   return list.map((type) => {
//     const li = document.createElement("li");
//     const input = document.createElement("input");
//     input.setAttribute("type", "checkbox");
//     input.setAttribute("name", "choice");
//     li.setAttribute("data-type", type);
//     li.setAttribute("class", "list");

//     li.append(input);
//     li.innerHTML = `<input type="checkbox">${type.toUpperCase()}`;
//     return li;
//   });
// };

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

const renderFilteredCards = (attackCards) => {
  const renderedCards = attackCards.map((attackCard) => {
    const attackCardNode = cloneFromTemplate("#attack-cards");
    setCardContent(attackCardNode, attackCard);
    setCardAttributes(attackCardNode, attackCard);
    addFlipEvent(attackCardNode);
    return attackCardNode;
  });

  return renderedCards;
};

const addEventListener = (popup, cards) => {
  const checkboxes = popup.querySelectorAll("input[name='choice']");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const selectedTypes = [
        ...popup.querySelectorAll("input[name='choice']:checked"),
      ]
        .map(({ value }) => value);
      const filterdeCards = cards.filter(({ type }) =>
        selectedTypes.includes(type)
      );
      const renderedCards = renderFilteredCards(filterdeCards);
      const leftPanel = popup.querySelector("#left-panel");
      leftPanel.replaceChildren(...renderedCards);
    });
  });
};

globalThis.onload = async () => {
  const popup = document.querySelector("body .popup");
  const template = cloneFromTemplate("#research-template");
  const cards = await fetchDiscardAttackPile();
  const types = getTypes(cards);
  const list = createList(types);
  const typeList = template.querySelector("#types-list");
  typeList.append(...list);
  popup.append(template);
  addEventListener(popup, cards);
};
