function getEffectivenessStages(type) {
  switch (type) {
    case "electric":
    case "fighting":
    case "ghost":
    case "ground":
    case "poison":
    case "psychic":
      return [-3, -2, -1, 0, 1, 2];
    case "dragon":
      return [-3, -2, -1, 0, 1];
    case "normal":
      return [-3, -2, -1, 0];
    default:
      return [-2, -1, 0, 1, 2];
  }
}

module.exports = {
  getEffectivenessStages,
};
