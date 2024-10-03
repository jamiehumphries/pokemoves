import { createWriteStream, existsSync, mkdirSync } from "fs";
import { get } from "https";
import { join } from "path";

const GAME_MASTER_ROOT =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/";

const localDir = join(import.meta.dirname, "pokeminers");
if (!existsSync(localDir)) {
  mkdirSync(localDir);
}

["latest.json", "timestamp.txt"].forEach((filename) => {
  const path = join(localDir, filename);
  const file = createWriteStream(path);
  get(GAME_MASTER_ROOT + filename, (res) => res.pipe(file));
});
