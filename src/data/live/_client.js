const axios = require("axios").default;

const GAME_MASTER =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json";

async function fetchGameMaster() {
  return await axios.get(GAME_MASTER).then((res) => res.data);
}

module.exports = {
  fetchGameMaster,
};
