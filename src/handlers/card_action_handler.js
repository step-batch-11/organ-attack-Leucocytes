export const handleNormalAffliction = (
  { opponentID, organCardID, game, afflictPoints },
) => {
  //

  game.afflictOrganOfOpponent(opponentID, organCardID, afflictPoints);
  return ({ success: true });
};

export const handleChartMixup = ({ game }) => {
  game.chartMixup();
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

export const handlePoison = ({ attackerID, organCardID, game }) => {
  game.removeOrgan(attackerID, organCardID);
  return ({ success: true });
};

export const handleRemoveOrgan = ({ opponentID, organCardID, game }) => {
  game.removeOrgan(opponentID, organCardID);
  return ({ success: true });
};

export const handleHybridAffliction = (
  { opponentID, organCardID, game, afflictPoints, canRemove },
) => {
  if (canRemove) game.removeOrgan(opponentID, organCardID);
  else game.afflictOrganOfOpponent(opponentID, organCardID, afflictPoints);
  return ({ success: true });
};

export const handleItsAlive = ({ attackerID, organCardID, game }) => {
  const organ = game.itsAlive(attackerID, organCardID);
  return { success: !(organ.isDead()) };
};

export const handleVaccine = ({ attackerID, game }) => {
  game.applyVaccine(attackerID);
  return ({ success: true });
};

export const handleSedate = ({ opponentID, game }) => {
  const sleepCount = game.applySedate(opponentID);

  return { success: sleepCount > 0 };
};
