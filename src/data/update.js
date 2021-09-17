const https = require("https");
const fs = require("fs");
const { join } = require("path");

const GAME_MASTER_ROOT =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/";

["latest.json", "timestamp.txt"].forEach((filename) => {
  const path = join(__dirname, "pokeminers", filename);
  const file = fs.createWriteStream(path);
  https.get(GAME_MASTER_ROOT + filename, (res) => res.pipe(file));
});
