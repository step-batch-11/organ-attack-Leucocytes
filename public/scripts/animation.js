import { createAttackCardElement } from "./utils.js";

export const animateFromDeck = async (targetCardElement) => {
  const deck = document.querySelector(".deck");

  if (!deck || !targetCardElement) return;

  // wait for layout
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  );

  const deckRect = deck.getBoundingClientRect();
  const targetRect = targetCardElement.getBoundingClientRect();

  //  CLONE REAL CARD (not template)
  const clone = targetCardElement.cloneNode(true);

  document.body.appendChild(clone);

  // start at deck
  clone.style.position = "fixed";
  clone.style.left = deckRect.left + "px";
  clone.style.top = deckRect.top + "px";
  clone.style.width = deckRect.width + "px";
  clone.style.height = deckRect.height + "px";
  clone.style.zIndex = "10";
  clone.style.pointerEvents = "none";
  clone.style.margin = "0";

  targetCardElement.style.opacity = "0";

  const randomRotate = Math.random() * 10 - 5;

  requestAnimationFrame(() => {
    clone.style.transition = "all 0.6s ease";
    deck.style.transform = "translate(-50%, -50%) scale(0.95)";
    setTimeout(() => {
      deck.style.transform = "translate(-50%, -50%) scale(1)";
    }, 100);
    clone.style.left = targetRect.left + "px";
    clone.style.top = targetRect.top + "px";
    clone.style.transform =
      `translate(0,0) scale(1) rotate(${randomRotate}deg)`;
    clone.style.boxShadow = "0 10px 20px rgba(0,0,0,0.5)";
  });

  // cleanup
  setTimeout(() => {
    clone.remove();
    targetCardElement.style.opacity = "1";
  }, 500);
};

export const animateToDiscard = async (cardElement, rect, cardData) => {
  const discardDeck = document.querySelector(".discard-deck");

  if (!cardElement || !discardDeck) return;

  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  );

  const discardRect = discardDeck.getBoundingClientRect();

  const clone = cardElement.cloneNode(true);
  document.body.appendChild(clone);

  clone.style.position = "fixed";
  clone.style.left = rect.left + "px";
  clone.style.top = rect.top + "px";
  clone.style.width = rect.width + "px";
  clone.style.height = rect.height + "px";
  clone.style.margin = "0";
  clone.style.zIndex = "50"; // below flash screen
  clone.style.pointerEvents = "none";

  cardElement.style.opacity = "0";

  const targetX = discardRect.left + discardRect.width / 2;
  const targetY = discardRect.top + discardRect.height / 2;

  requestAnimationFrame(() => {
    clone.style.transition = "all 0.5s ease";

    clone.style.left = targetX + "px";
    clone.style.top = targetY + "px";
    clone.style.transform = "translate(-50%, -50%) scale(0.6) rotate(" +
      (Math.random() * 20 - 10) +
      "deg)";
  });

  setTimeout(() => {
    clone.remove();

    // 🔥 render REAL card in discard
    const discardTop = document.querySelector(".discard-top");
    if (discardTop && cardData) {
      discardTop.innerHTML = "";

      const newCard = createAttackCardElement(cardData);

      newCard.style.width = "100%";
      newCard.style.height = "100%";
      newCard.style.transform = `rotate(${Math.random() * 6 - 3}deg)`;

      discardTop.appendChild(newCard);
    }
  }, 500);
};
