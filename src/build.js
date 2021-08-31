const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");
const nunjucks = require("nunjucks");
const { join } = require("path");
const rimraf = require("rimraf");

const PVPOKE_FORMAT_SELECT =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/modules/formatselect.php";
const GAME_MASTER =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json";

const root = "docs";
rimraf.sync(root);

const views = join(__dirname, "views");
nunjucks.configure(views);

fs.mkdirSync(root);
fs.writeFileSync(join(root, ".nojekyll"), "");
fs.writeFileSync(join(root, "CNAME"), "www.pokemoves.com");

async function build() {
  const gameMaster = await getGameMaster();
  const moves = parseMoves(gameMaster);
  const formats = await getFormats();
  for (const format of formats) {
    const { cup, cpLimit } = format;
    const html = await getHtml(format, moves);
    const dir = join(root, cup, cpLimit);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(join(dir, "index.html"), html);
  }
}

async function getGameMaster() {
  return await axios.get(GAME_MASTER).then((res) => res.data);
}

function parseMoves(gameMaster) {
  const entries = gameMaster.moves.map((move) => [move.moveId, move]);
  return Object.fromEntries(entries);
}

async function getFormats() {
  const data = await axios.get(PVPOKE_FORMAT_SELECT).then((res) => res.data);
  const $ = cheerio.load(data);
  return $("option")
    .map((_, el) => {
      const { cup, value: cpLimit } = el.attribs;
      const title = el.children[0].data;
      return { cup, cpLimit, title };
    })
    .get()
    .filter((format) => format.cup !== "custom");
}

async function getHtml(format, moves) {
  const { cup, cpLimit, title } = format;
  const list = await getList(cup, cpLimit, moves);
  return nunjucks.render("format.njk", { title, list });
}

async function getList(cup, cpLimit, moves) {
  const url = `https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/${cup}/overall/rankings-${cpLimit}.json`;
  const unfilteredList = await axios.get(url).then((res) => res.data);
  const getId = ({ speciesId }) => speciesId.replace(/(_shadow|_xs)/g, "");
  const list = unfilteredList.filter((pkm, idx, arr) => {
    const id = getId(pkm);
    return arr.findIndex((p) => getId(p) === id) === idx;
  });
  const getMove = ({ moveId }) => moves[moveId];
  for (const pokemon of list) {
    pokemon.speciesName = pokemon.speciesName.replace(" (Shadow)", "");
    pokemon.moves.fastMoves = pokemon.moves.fastMoves.map(getMove);
    pokemon.moves.chargedMoves = pokemon.moves.chargedMoves.map(getMove);
  }
  return list;
}

build();
