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

const displayOpponentHand = async (opponentID) => {
  clearPopup();
  const opponentHand = await postJSON("/opponent-hands", { opponentID });
  const clinicalAuditPopup = cloneFromTemplate(".clinical-audit-popup");
  const popup = document.querySelector(".popup");
  const opponentAttackCards = opponentHand.attackCards;
  const attackCards = clinicalAuditPopup.querySelector(".attack-cards");
  const attackCardNodes = createAttackCardNodes(opponentAttackCards);
  attackCards.append(...attackCardNodes);
  popup.append(clinicalAuditPopup);

  attackCards.onclick = async (e) => {
    const attackCardID = e.target.getAttribute("data-id");
    clearPopup();
    await postJSON("/audit", { attackCardID, opponentID });
  };
};

export const displayOpponentsHands = async (
  { player, opponents, attackCardID },
) => {
  const opponentIDs = opponents.map((opponent) => opponent.id);
  opponentIDs.forEach(async (opponentID) => {
    await displayOpponentHand(opponentID);
  });

  await postJSON("/refillSelfPostAudit", { playerID: player.id, attackCardID });
};
export const performCryopreservation = async ({ player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID, isInstant:true };
  await postJSON("/attack", body);
};

