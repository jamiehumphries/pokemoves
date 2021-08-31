const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");
const { join } = require("path");
const rimraf = require("rimraf");

const PVPOKE_FORMAT_SELECT =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/modules/formatselect.php";

const root = "docs";
rimraf.sync(root);

fs.mkdirSync(root);
fs.writeFileSync(join(root, ".nojekyll"), "");
fs.writeFileSync(join(root, "CNAME"), "www.pokemoves.com");

async function build() {
  const formats = await getFormats();
  for (const { value, cup, name } of formats) {
    const dir = join(root, cup, value);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(join(dir, "index.html"), name);
  }
}

async function getFormats() {
  const data = await axios.get(PVPOKE_FORMAT_SELECT).then((res) => res.data);
  const $ = cheerio.load(data);
  return $("option")
    .map((_, el) => {
      const { cup, value } = el.attribs;
      const name = el.children[0].data;
      return { cup, value, name };
    })
    .get();
}

build();
