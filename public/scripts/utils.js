export const getAfflictableOrgans = (opponents, attackCard) => {
  const afflictableOrgansIds = attackCard.afflictableOrgans;

  const allOrganCards = opponents.reduce((allCards, { organCards, id }) => {
    organCards.forEach((card) => card.playerId = id);
    return allCards.concat(organCards);
  }, []);

  if (attackCard.isWild || attackCard.id === 19) return allOrganCards;

  return allOrganCards.filter(({ id }) =>
    afflictableOrgansIds.includes(id) || id === 100
  );
};

export const cloneFromTemplate = (templateID, element = "*") => {
  const template = document.querySelector(templateID);
  return template.content.cloneNode(true).querySelector(element);
};

export const postJSON = (url, body) => {
  return fetch(url, { method: "POST", body: JSON.stringify(body) })
    .then((r) => r.json());
};

export const fetchPlayersData = () => {
  const mockData = { player: [], opponents: [], playerId: null };

  return fetch("/game-state")
    .then((res) => res.json())
    .catch((err) => {
      console.error(err);
      return mockData;
    });
};
