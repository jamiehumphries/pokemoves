async function fetchGameMaster() {
  return await Promise.resolve(require("./latest.json"));
}

module.exports = {
  fetchGameMaster,
};
