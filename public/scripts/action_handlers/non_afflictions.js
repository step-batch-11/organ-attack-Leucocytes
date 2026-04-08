import { clearPopup } from "../afflict-organ.js";
import { cloneFromTemplate, postJSON } from "../utils.js";

export const performChartMixup = async ({ player, attackCardID }) => {
  clearPopup();
  const body = { attackerID: player.id, attackCardID };
  await postJSON("/attack", body);
};

export const performVaccine = async ({ player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID };
  const { success } = await postJSON("/attack", body);

  if (success) {
    const organsArea = document.querySelector(".organs");
    organsArea.dataset.vaccine = 2;
  }
};

export const performByTheBook = async ({ player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID };
  await postJSON("/attack", body);
};

const setAttributes = (node, attackCard) => {
  node.setAttribute("class", "attack-card");
  node.setAttribute("data-id", attackCard.id);
  node.setAttribute("data-type", attackCard.type);
  node.setAttribute("id", `attack-${attackCard.id}`);
  node.setAttribute("is-instant", Number(attackCard.isInstant));
};

const createAttackCardNodes = (opponentAttackCards) =>
  opponentAttackCards.map((opponentAttackCard) => {
    const attackCardNode = document.createElement("div");
    const nameNode = document.createElement("h1");

    nameNode.textContent = opponentAttackCard.name;
    setAttributes(attackCardNode, opponentAttackCard);

    attackCardNode.append(nameNode);

    return attackCardNode;
  });

const highlight = (attackCards) => {
  attackCards.querySelectorAll(".attack-card").forEach((card) => {
    card.onclick = () => {
      document
        .querySelectorAll(".attack-card")
        .forEach((c) => c.classList.remove("active"));

      card.classList.add("active");
    };
  });
};

const displayOpponentHand = (opponentID, opponentIDs) => {
  return new Promise(async (resolve) => {
    const opponentHand = await postJSON("/opponent-hands", { opponentID });
    const clinicalAuditPopup = cloneFromTemplate(".clinical-audit-popup");
    const popup = document.querySelector(".popup");

    const attackCards = clinicalAuditPopup.querySelector(".attack-cards");
    const attackCardNodes = createAttackCardNodes(opponentHand.attackCards);
    attackCards.append(...attackCardNodes);
    popup.append(clinicalAuditPopup);
    let selectedAttackCardID = null;

    attackCards.onclick = (e) => {
      selectedAttackCardID = e
        .target
        .closest(".attack-card")
        .getAttribute("data-id");
    };

    highlight(attackCards);

    const nextBtn = popup.querySelector(".next-btn");
    nextBtn.onclick = async () => {
      if (!selectedAttackCardID) return;

      clearPopup();

      await postJSON("/audit", {
        attackCardID: selectedAttackCardID,
        opponentID,
      });

      if (opponentIDs.length === 0) resolve();
      else {
        await displayOpponentHand(opponentIDs.shift(), opponentIDs);
        resolve();
      }
    };
  });
};

export const displayOpponentsHands = async (
  { player, opponents, attackCardID },
) => {
  clearPopup();
  const opponentIDs = opponents.map((opponent) => opponent.id);
  await displayOpponentHand(opponentIDs.shift(), opponentIDs);
  await postJSON("/attack", { attackerID: player.id, attackCardID });
};

export const performCryopreservation = async ({ player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID, isInstant: true };
  await postJSON("/attack", body);
};
