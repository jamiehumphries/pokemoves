const https = require("https");
const fs = require("fs");
const { join } = require("path");

const GAME_MASTER_ROOT =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/";

const localDir = join(__dirname, "pokeminers");
if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir);
}

["latest.json", "timestamp.txt"].forEach((filename) => {
  const path = join(localDir, filename);
  const file = fs.createWriteStream(path);
  https.get(GAME_MASTER_ROOT + filename, (res) => res.pipe(file));
});
