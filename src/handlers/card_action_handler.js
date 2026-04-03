export const handleNormalAffliction = ({ opponentID, organCardID, game }) => {
  game.afflictOrganOfOpponent(opponentID, organCardID);
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
