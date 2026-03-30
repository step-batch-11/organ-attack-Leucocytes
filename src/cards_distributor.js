export const distributeCards = (attackCards, organCards, players) => {
  const organCardsLimit = Math.floor(organCards.length / players.length);
  const attackCardsLimit = 5;

  players.forEach((player) => {
    const playerAttackCards = attackCards.splice(0, attackCardsLimit);
    const playerOrganCards = organCards.splice(0, organCardsLimit);
    player.fillHand(playerAttackCards, playerOrganCards);
  });
};
