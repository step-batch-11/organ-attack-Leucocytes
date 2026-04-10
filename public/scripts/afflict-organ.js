import { getAfflictableOrgans, getRemovableOrgans, postJSON } from "./utils.js";

const createPopup = (collection) => {
  return collection.map((item) => {
    const icon = document.createElement("div");
    icon.setAttribute("class", "organ");
    icon.setAttribute("organ-id", `${item.id}`);
    icon.setAttribute("player-id", `${item.playerID}`);
    const organName = item.name;
    const image = document.createElement("img");
    image.setAttribute("src", `/assets/organs/${organName.toLowerCase()}.png`);
    icon.append(image);
    return icon;
  });
};

export const clearPopup = () => {
  const popup = document.querySelectorAll(".popup > div");
  popup.forEach((container) => container.remove());
};

const performAttack = async (
  attackCardID,
  player,
  isInstant,
  canRemove,
  organ,
) => {
  const organCardID = Number(organ.getAttribute("organ-id"));
  const opponentID = Number(organ.getAttribute("player-id"));

  const body = {
    attackCardID,
    attackerID: player.id,
    organCardID,
    opponentID,
    isInstant,
    canRemove,
  };

  clearPopup();

  await postJSON("/attack", body);
  /**
   * DO NOT REMOVE
   * await postJSON("/action", body);
   * need it for immunity boost
   * it's the future!!!
   */
};

const createPopupFragment = (
  opponents,
  attackCard,
  attackCardID,
  player,
  isInstant,
  canRemove,
) => {
  const container = document.createElement("div");

  if (canRemove) container.setAttribute("class", "popup-removable");
  else container.setAttribute("class", "popup-afflictable");

  const organsGetter = canRemove ? getRemovableOrgans : getAfflictableOrgans;
  const organCards = organsGetter(opponents, attackCard);

  const organs = createPopup(organCards);
  container.append(...organs);
  container.addEventListener("click", async (e) => {
    const organ = e.target.closest(".organ");
    performAttack(attackCardID, player, isInstant, canRemove, organ);
  });
  document.querySelector(".popup").append(container);
};

export const displayOrgans = (
  { player, opponents, attackCardID, isInstant, organDiscardPile },
) => {
  const attackCard = player.attackCards
    .find(({ id }) => id === attackCardID);
  clearPopup();

  const cards = {
    "medicine": player
      .organCards.filter(({ health, maxHealth }) => health !== maxHealth),
    "medical-miracle": player
      .organCards.filter(({ health, maxHealth }) => health !== maxHealth),
    "poison": player.organCards,
    "itsAlive": organDiscardPile,
  };

  if (attackCard.action in cards) {
    const container = document.createElement("div");
    container.setAttribute("class", "popup-afflictable");

    const organCards = cards[attackCard.action];

    const organs = createPopup(organCards);
    container.append(...organs);
    if (attackCard.action === "medical-miracle") {
      const selectedCards = [];
      let totalHeal = 0;

      container.addEventListener("click", async (e) => {
        const organ = e.target.closest(".organ");
        if (!organ) return;

        const organID = Number(organ.getAttribute("organ-id"));
        const organData = player.organCards.find((o) => o.id === organID);
        if (!organData) return;

        const remainingHeal = organData.maxHealth - organData.health;

        if (remainingHeal === 0) return;
        if (totalHeal >= 2) return;

        const count = selectedCards.filter((id) => id === organID).length;
        if (count > remainingHeal) return;

        selectedCards.push(organID);
        totalHeal++;
        organ.setAttribute("data-selected", "true");
        const isWild = !(organCards.map(({ name }) => name).includes("Wild"));
        organData.health += 1;
        if (
          totalHeal === 2 ||
          (organCards.length === 1 && isWild)
        ) {
          clearPopup();

          await postJSON("/attack", {
            attackerID: player.id,
            attackCardID,
            organCardIDs: selectedCards,
          });
        }
      });
    } else {
      container.addEventListener("click", async (e) => {
        const organ = e.target.closest(".organ");
        performAttack(attackCardID, player, isInstant, false, organ);
      });
    }
    document.querySelector(".popup").append(container);
  } else {
    createPopupFragment(
      opponents,
      attackCard,
      attackCardID,
      player,
      isInstant,
      false,
    );
    createPopupFragment(
      opponents,
      attackCard,
      attackCardID,
      player,
      isInstant,
      true,
    );
  }
};

const createPopupPlayers = (collection) => {
  return collection.map((item) => {
    const icon = document.createElement("div");
    icon.setAttribute("id", "icon-popup-player");
    icon.setAttribute("player-id", `${item.id}`);
    icon.setAttribute("class", "organ");
    icon.textContent = item.name;

    return icon;
  });
};

export const displayOpponents = ({ player, opponents, attackCardID }) => {
  const attackCard = player.attackCards.find(({ id }) => id === attackCardID);

  clearPopup();

  const container = document.createElement("div");
  container.setAttribute("class", "popup-afflictable");

  const opponentsAvatar = opponents;

  const players = createPopupPlayers(opponentsAvatar);
  container.append(...players);
  container.addEventListener("click", async (e) => {
    const playerAvatar = e.target.closest(".organ");

    performAttack(attackCardID, player, false, false, playerAvatar);
  });

  document.querySelector(".popup").append(container);
};
