const axios = require("axios").default;
const cheerio = require("cheerio");

const GAME_MASTER =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json";

async function getGameMaster() {
  return await axios.get(GAME_MASTER).then((res) => res.data);
}

module.exports = {
  getGameMaster,
};
