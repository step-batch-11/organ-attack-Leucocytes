export const getAfflictableOrgans = (
  { attackCards },
  opponents,
  attackCardId,
) => {
  const attackCard = attackCards
    .find(({ id }) => id === attackCardId);
  const afflictableOrgansIds = attackCard.afflictableOrgans;

  const allOrganCards = opponents.reduce((allCards, { organCards, id }) => {
    organCards.forEach((card) => card.playerId = id);
    return allCards.concat(organCards);
  }, []);

  if (attackCard.isWild || attackCardId === 19) return allOrganCards;

  return allOrganCards.filter(({ id }) =>
    afflictableOrgansIds.includes(id) || id === 100
  );
};

export const cloneFromTemplate = (templateID, element = "*") => {
  const template = document.querySelector(templateID);
  return template.content.cloneNode(true).querySelector(element);
};
