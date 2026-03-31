import { setupGame } from "./board_setup.js";

window.onload = async () => {
  await setupGame();
  const attackCards = document.querySelector(".player-area .attack-cards");

  attackCards.addEventListener("click", (e) => {
    const attackCard = e.target;
    console.log("clicked", attackCard.id);
  });
};
