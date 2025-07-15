import { createWriteStream, existsSync, mkdirSync } from "fs";
import { get } from "https";
import { join, parse } from "path";

const GAME_MASTER_ROOT =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/";

const localDir = join(import.meta.dirname, "pvpoke");
if (!existsSync(localDir)) {
  mkdirSync(localDir);
}

const paths = [
  ...["moves", "pokemon"].map((file) => `gamemaster/${file}.json`),
  ...["500", "1500", "2500", "10000"].map(
    (cp) => `rankings/all/overall/rankings-${cp}.json`,
  ),
];

for (const path of paths) {
  const { name, ext } = parse(path);
  const fullPath = join(localDir, name + ext);
  const file = createWriteStream(fullPath);
  get(GAME_MASTER_ROOT + path, (res) => res.pipe(file));
}
