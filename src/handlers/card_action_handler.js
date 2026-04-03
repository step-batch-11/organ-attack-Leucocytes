export const handleNormalAffliction = (
  { opponentID, organCardID, game, afflictPoints },
) => {
  game.afflictOrganOfOpponent(opponentID, organCardID, afflictPoints);
  return ({ success: true });
};

export const handleChartMixup = ({ game }) => {
  game.chartMixup();
  return ({ success: true });
};

export const handleVaccine = ({ attackerID, game }) => {
  game.applyVaccine(attackerID);
  return ({ success: true });
};

export const handleTransplant = (
  { attackerID, opponentID, organCardID, game },
) => {
  game.transplantOrgan(attackerID, opponentID, organCardID);
  return ({ success: true });
};

export const handleMedicine = ({ attackerID, organCardID, game }) => {
  game.healOrgan(attackerID, organCardID);
  return ({ success: true });
};

export const handleBythebook = ({ game }) => {
  game.bythebook();
  return ({ success: true });
};
