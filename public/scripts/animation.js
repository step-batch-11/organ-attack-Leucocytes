import { createAttackCardElement } from "./utils.js";

// export const animateToDiscard = async (cardElement, rect) => {
//   const discardDeck = document.querySelector(".discard-deck");

//   if (!cardElement || !discardDeck) return;

//   // wait for DOM/layout
//   await new Promise((r) =>
//     requestAnimationFrame(() => requestAnimationFrame(r))
//   );

//   const discardRect = discardDeck.getBoundingClientRect();

//   // create clone
//   const clone = cardElement.cloneNode(true);
//   document.body.appendChild(clone);

//   // initial position (same as card)
//   clone.style.position = "fixed";
//   clone.style.left = rect.left + "px";
//   clone.style.top = rect.top + "px";
//   clone.style.width = rect.width + "px";
//   clone.style.height = rect.height + "px";
//   clone.style.margin = "0";
//   clone.style.zIndex = "10"; // 🔥 below flash screen
//   clone.style.pointerEvents = "none";

//   // hide original card
//   cardElement.style.opacity = "0";

//   // calculate positions
//   const startX = rect.left;
//   const startY = rect.top;

//   const targetX = discardRect.left + discardRect.width / 2;
//   const targetY = discardRect.top + discardRect.height / 2;

//   // 🔥 CURVE midpoint (push down so it avoids flash screen)
//   const midX = (startX + targetX) / 2;
//   const midY = startY + 120; // adjust this if needed

//   // animate (curve path)
//   requestAnimationFrame(() => {
//     clone.animate(
//       [
//         {
//           left: startX + "px",
//           top: startY + "px",
//           transform: "scale(1)",
//           opacity: 1,
//         },
//         {
//           left: midX + "px",
//           top: midY + "px",
//           transform: "scale(0.9)",
//           opacity: 0.9,
//         },
//         {
//           left: targetX + "px",
//           top: targetY + "px",
//           transform: "translate(-50%, -50%) scale(0.6) rotate(" +
//             (Math.random() * 20 - 10) +
//             "deg)",
//           opacity: 0.8,
//         },
//       ],
//       {
//         duration: 600,
//         easing: "ease-in-out",
//         fill: "forwards",
//       },
//     );
//   });

//   // cleanup
//   setTimeout(() => {
//     clone.remove();
//   }, 600);
// };
// export const animateFromDeck = async (targetCardElement) => {
//   console.log("animation from deck cards");
//   const deck = document.querySelector(".deck"); // 👈 your main deck

//   if (!deck || !targetCardElement) return;

//   // wait for DOM/layout
//   await new Promise((r) =>
//     requestAnimationFrame(() => requestAnimationFrame(r))
//   );

//   const deckRect = deck.getBoundingClientRect();
//   const targetRect = targetCardElement.getBoundingClientRect();

//   // create fake card (coming from deck)
//   const clone = document.createElement("div");
//   clone.classList.add("attack-card");

//   // simple back design (optional)
//   clone.style.background = "linear-gradient(145deg, #1e293b, #0f172a)";
//   clone.style.border = "1px solid rgba(255,255,255,0.1)";
//   clone.style.borderRadius = "8px";

//   document.body.appendChild(clone);

//   // start at deck
//   clone.style.position = "fixed";
//   clone.style.left = deckRect.left + "px";
//   clone.style.top = deckRect.top + "px";
//   clone.style.width = deckRect.width + "px";
//   clone.style.height = deckRect.height + "px";
//   clone.style.zIndex = "10";
//   clone.style.pointerEvents = "none";

//   // hide real card initially
//   targetCardElement.style.opacity = "0";

//   requestAnimationFrame(() => {
//     clone.style.transition = "all 0.7s ease";

//     clone.style.left = targetRect.left + "px";
//     clone.style.top = targetRect.top + "px";
//     clone.style.transform = "translate(0,0) scale(1) rotate(" +
//       (Math.random() * 10 - 5) +
//       "deg)";
//   });

//   setTimeout(() => {
//     clone.remove();
//     targetCardElement.style.opacity = "1"; // reveal actual card
//   }, 600);
// };
export const animateFromDeck = async (targetCardElement) => {
  const deck = document.querySelector(".deck");

  if (!deck || !targetCardElement) return;

  // wait for layout
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  );

  const deckRect = deck.getBoundingClientRect();
  const targetRect = targetCardElement.getBoundingClientRect();

  // 🔥 CLONE REAL CARD (not template)
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

  // 🔥 show BACK side first
  // clone.classList.add("flip");

  // hide real card
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
  }, 650);
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
