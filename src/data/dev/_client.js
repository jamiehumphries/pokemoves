async function getGameMaster() {
  return await Promise.resolve(require("./latest.json"));
}

module.exports = {
  getGameMaster,
};
