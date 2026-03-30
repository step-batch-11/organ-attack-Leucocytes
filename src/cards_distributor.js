export const distributeCards = (attackCards, organCards, players) => {
  const organCardsCount = Math.floor(organCards.length / players.length);

  players.forEach((player) => {
    const playerAttackCards = attackCards.splice(0, 5);
    const playerOrganCards = organCards.splice(0, organCardsCount);
    player.fillHand(playerAttackCards, playerOrganCards);
  });
};
